/**
 * Restore catalogue hero/gallery URLs that were rewritten to `nobg_*` files back to the
 * original uploads still present in the same Storage folder.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json node scripts/restore-catalog-original-images.mjs --dry-run
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json node scripts/restore-catalog-original-images.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import admin from "firebase-admin";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

function loadCred() {
  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!path || !existsSync(path)) {
    throw new Error("Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file.");
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function storagePathFromUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "firebasestorage.googleapis.com") {
      const m = u.pathname.match(/\/v0\/b\/[^/]+\/o\/([^?]+)/);
      return m ? decodeURIComponent(m[1]) : null;
    }
    if (u.hostname === "storage.googleapis.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      parts.shift();
      return decodeURIComponent(parts.join("/"));
    }
  } catch {
    /* ignore */
  }
  return null;
}

function tokenUrl(bucketName, path, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${encodeURIComponent(token)}`;
}

function nobgStem(nobgPath) {
  const name = nobgPath.split("/").pop() ?? "";
  return name.replace(/^nobg_/, "");
}

function timestampFromStem(stem) {
  const m = stem.match(/^(\d+)_/);
  return m ? m[1] : null;
}

/** Pick the best non-nobg file in the same folder for a nobg object path. */
function pickOriginalFile(nobgPath, folderFiles) {
  const stem = nobgStem(nobgPath);
  const ts = timestampFromStem(stem);

  const exact = folderFiles.find((f) => f.endsWith("/" + stem));
  if (exact) return exact;

  const byStemPrefix = folderFiles.filter((f) => {
    const base = f.split("/").pop() ?? "";
    if (base.startsWith("nobg_")) return false;
    return base.startsWith(stem) || stem.startsWith(base) || (ts && base.startsWith(`${ts}_`));
  });
  if (byStemPrefix.length === 1) return byStemPrefix[0];
  if (byStemPrefix.length > 1) {
    byStemPrefix.sort((a, b) => (a.split("/").pop()?.length ?? 0) - (b.split("/").pop()?.length ?? 0));
    return byStemPrefix[0];
  }
  return null;
}

function collectUrlFields(data) {
  const out = [];
  if (typeof data.image === "string") out.push(["image", data.image]);
  if (Array.isArray(data.galleryImageUrls)) {
    data.galleryImageUrls.forEach((u, i) => typeof u === "string" && out.push([`galleryImageUrls.${i}`, u]));
  }
  if (Array.isArray(data.styleVariants)) {
    data.styleVariants.forEach((v, i) => typeof v?.image === "string" && out.push([`styleVariants.${i}.image`, v.image]));
  }
  if (Array.isArray(data.galleryStyleLinks)) {
    data.galleryStyleLinks.forEach((v, i) => typeof v?.image === "string" && out.push([`galleryStyleLinks.${i}.image`, v.image]));
  }
  return out;
}

function applyUrlReplacements(data, replacements) {
  const next = structuredClone(data);
  for (const [field, newUrl] of replacements) {
    if (field === "image") next.image = newUrl;
    else if (field.startsWith("galleryImageUrls.")) {
      const i = Number(field.split(".")[1]);
      if (Array.isArray(next.galleryImageUrls)) next.galleryImageUrls[i] = newUrl;
    } else if (field.startsWith("styleVariants.")) {
      const i = Number(field.split(".")[1]);
      if (Array.isArray(next.styleVariants) && next.styleVariants[i]) next.styleVariants[i].image = newUrl;
    } else if (field.startsWith("galleryStyleLinks.")) {
      const i = Number(field.split(".")[1]);
      if (Array.isArray(next.galleryStyleLinks) && next.galleryStyleLinks[i]) next.galleryStyleLinks[i].image = newUrl;
    }
  }
  return next;
}

const cred = loadCred();
const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "lizzy-fusion.firebasestorage.app";
admin.initializeApp({ credential: admin.credential.cert(cred), storageBucket: bucketName });
const db = admin.firestore();
const bucket = admin.storage().bucket();

const folderCache = new Map();
async function listFolderFiles(folderPrefix) {
  if (folderCache.has(folderPrefix)) return folderCache.get(folderPrefix);
  const [files] = await bucket.getFiles({ prefix: folderPrefix });
  const names = files.map((f) => f.name);
  folderCache.set(folderPrefix, names);
  return names;
}

async function downloadUrlForPath(path) {
  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [meta] = await file.getMetadata();
  const raw = meta.metadata?.firebaseStorageDownloadTokens;
  const token = raw ? String(raw).split(",")[0] : null;
  if (!token) return null;
  return tokenUrl(bucket.name, path, token);
}

const snap = await db.collection("catalog_products").get();
let updatedDocs = 0;
let skippedDocs = 0;
const report = [];

for (const doc of snap.docs) {
  const data = doc.data();
  const fields = collectUrlFields(data);
  const nobgFields = fields.filter(([, url]) => {
    const p = storagePathFromUrl(url);
    return p && p.split("/").pop()?.startsWith("nobg_");
  });
  if (!nobgFields.length) continue;

  const urlByNobgPath = new Map();
  const missing = [];

  for (const [, url] of nobgFields) {
    const nobgPath = storagePathFromUrl(url);
    if (!nobgPath || urlByNobgPath.has(nobgPath)) continue;
    const folderPrefix = nobgPath.split("/").slice(0, -1).join("/") + "/";
    const folderFiles = await listFolderFiles(folderPrefix);
    const originalPath = pickOriginalFile(nobgPath, folderFiles);
    if (!originalPath) {
      missing.push({ nobgPath, reason: "no matching original in folder" });
      continue;
    }
    const originalUrl = await downloadUrlForPath(originalPath);
    if (!originalUrl) {
      missing.push({ nobgPath, originalPath, reason: "original exists but has no download token" });
      continue;
    }
    urlByNobgPath.set(nobgPath, { originalPath, originalUrl });
  }

  if (missing.length) {
    skippedDocs += 1;
    report.push({ slug: doc.id, status: "skipped", missing, nobgFields: nobgFields.map(([f, u]) => ({ field: f, url: u })) });
    continue;
  }

  const replacements = nobgFields.map(([field, url]) => {
    const nobgPath = storagePathFromUrl(url);
    return [field, urlByNobgPath.get(nobgPath).originalUrl];
  });

  const nextData = applyUrlReplacements(data, replacements);
  const uniqueOriginals = [...new Set([...urlByNobgPath.values()].map((v) => v.originalPath))];

  if (!dryRun) {
    await doc.ref.set(nextData, { merge: true });
  }

  updatedDocs += 1;
  report.push({
    slug: doc.id,
    status: dryRun ? "would_update" : "updated",
    fields: replacements.map(([field, url]) => ({ field, url })),
    originals: uniqueOriginals,
  });
}

console.log(
  JSON.stringify(
    {
      dryRun,
      bucket: bucket.name,
      updatedDocs,
      skippedDocs,
      report,
    },
    null,
    2,
  ),
);

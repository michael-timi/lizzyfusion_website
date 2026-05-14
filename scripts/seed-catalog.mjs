/**
 * One-shot migration: push `sampleProducts` from src/lib/site.ts into Firestore `catalog_products`.
 *
 * After running this, Firestore is the single source of truth for the storefront — the admin can
 * edit / delete each product from /admin/catalog and the changes appear on /shop instantly (via
 * `revalidateTag(CATALOG_CACHE_TAG, "max")`).
 *
 * Prereqs:
 *   npm install
 *   Download a Firebase **service account** JSON (Project settings → Service accounts).
 *
 * Run (from repo root):
 *   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json npm run catalog:seed
 *
 * By default this **skips** slugs that already exist in Firestore (so admin edits are preserved).
 * Pass `--force` to overwrite every sample slug back to the code default — useful when the code
 * defaults move forward and you want Firestore to follow:
 *   GOOGLE_APPLICATION_CREDENTIALS=... npm run catalog:seed -- --force
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const force = args.includes("--force");

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error("Missing GOOGLE_APPLICATION_CREDENTIALS (absolute path to service account JSON).");
  process.exit(1);
}

const credJson = JSON.parse(readFileSync(credPath, "utf8"));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(credJson) });
}

const db = admin.firestore();

/**
 * Parse `sampleProducts` from src/lib/site.ts without importing TypeScript — extract the array
 * literal between `export const sampleProducts = [` and `] as const;` and eval it in a sandbox.
 * This keeps the seed script as plain Node ESM with zero TS tooling.
 */
function loadSampleProducts() {
  const sitePath = join(__dirname, "../src/lib/site.ts");
  const src = readFileSync(sitePath, "utf8");
  const start = src.indexOf("export const sampleProducts = [");
  if (start < 0) {
    throw new Error("Could not locate `export const sampleProducts = [` in src/lib/site.ts.");
  }
  const open = src.indexOf("[", start);
  const end = src.indexOf("] as const;", open);
  if (end < 0) {
    throw new Error("Could not locate end of sampleProducts array (`] as const;`) in src/lib/site.ts.");
  }
  const literal = src.slice(open, end + 1);
  return Function(`"use strict"; return (${literal});`)();
}

const products = loadSampleProducts();
console.log(`Loaded ${products.length} sample products from src/lib/site.ts.`);
console.log(force ? "Mode: --force (overwrite existing)." : "Mode: skip existing slugs (default).");

const col = db.collection("catalog_products");
let upserted = 0;
let skipped = 0;
for (const p of products) {
  const ref = col.doc(p.slug);
  if (!force) {
    const snap = await ref.get();
    if (snap.exists) {
      skipped += 1;
      console.log(`  skip   catalog_products/${p.slug} (already exists)`);
      continue;
    }
  }
  // Strip undefined fields so Firestore stores a clean document. `sampleProducts` is `as const`,
  // and Firestore stores frozen objects fine, but spread to a plain object for safety.
  const payload = JSON.parse(JSON.stringify(p));
  await ref.set(payload, { merge: false });
  upserted += 1;
  console.log(`  upsert catalog_products/${p.slug}`);
}

console.log(`\nDone. Upserted ${upserted}, skipped ${skipped}.`);
console.log(
  upserted > 0
    ? "Visit /admin/catalog on the running app to confirm; the storefront refreshes via revalidateTag on the next admin edit, or after the unstable_cache TTL (5 min)."
    : "No changes — re-run with --force to overwrite code-default slugs back to their bootstrap values.",
);

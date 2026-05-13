/**
 * Writes starter Journal posts to Firestore (bypasses client rules).
 *
 * Prereqs:
 *   npm install
 *   Download a Firebase **service account** JSON (Project settings → Service accounts).
 *
 * Run (from repo root):
 *   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json node scripts/seed-blog.mjs
 *
 * Re-running overwrites the same doc ids (merge).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error("Missing GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON).");
  process.exit(1);
}

const credJson = JSON.parse(readFileSync(credPath, "utf8"));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(credJson) });
}

const db = admin.firestore();
const seedPath = join(__dirname, "../src/data/blog-seed-articles.json");
const articles = JSON.parse(readFileSync(seedPath, "utf8"));

for (const art of articles) {
  const { slug, ...rest } = art;
  await db
    .collection("blog_posts")
    .doc(slug)
    .set(
      {
        ...rest,
        slug,
        authorUid: "seed-journal",
        authorName: "Lizzy Fusion studio",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  console.log("Upserted blog_posts/", slug);
}

console.log("Done. Open /blog on the site after indexes are ready.");

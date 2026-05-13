import { collection, getDocs } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getFirebaseAppServer } from "@/lib/firebase-server-app";
import { sampleProducts } from "@/lib/site";

/** Same shape as `SampleProduct` — used for merged catalogue (code + Firestore). */
export type CatalogProduct = {
  slug: string;
  name: string;
  tag: string;
  price: number;
  lead: string;
  description: string;
  image: string;
};

function isCatalogProduct(data: unknown): data is CatalogProduct {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  return (
    typeof o.slug === "string" &&
    o.slug.length > 0 &&
    typeof o.name === "string" &&
    o.name.length > 0 &&
    typeof o.tag === "string" &&
    o.tag.length > 0 &&
    typeof o.price === "number" &&
    Number.isFinite(o.price) &&
    o.price >= 0 &&
    typeof o.lead === "string" &&
    typeof o.description === "string" &&
    typeof o.image === "string" &&
    o.image.startsWith("https://")
  );
}

async function fetchFirestoreCatalog(): Promise<CatalogProduct[]> {
  const app = getFirebaseAppServer();
  if (!app) return [];
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, "catalog_products"));
  const out: CatalogProduct[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    if (!isCatalogProduct(data)) continue;
    if (data.slug !== d.id) continue;
    out.push(data);
  }
  return out;
}

/** Raw Firestore rows (validated). For admin edit links and diagnostics — not merged with code defaults. */
export async function listFirestoreCatalogProducts(): Promise<CatalogProduct[]> {
  return fetchFirestoreCatalog();
}

/** Codebase defaults plus Firestore `catalog_products` (document id = `slug`; remote wins on duplicate slug). */
export async function getMergedCatalog(): Promise<CatalogProduct[]> {
  const remote = await fetchFirestoreCatalog();
  const map = new Map<string, CatalogProduct>();
  for (const p of sampleProducts) {
    map.set(p.slug, { ...p });
  }
  for (const p of remote) {
    map.set(p.slug, p);
  }
  return Array.from(map.values());
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  const merged = await getMergedCatalog();
  return merged.find((p) => p.slug === slug);
}

import { collection, getDocs } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getFirebaseAppServer } from "@/lib/firebase-server-app";
import { sampleProducts } from "@/lib/site";

/** Same shape as `SampleProduct` — used for merged catalogue (code + Firestore). */
export type CatalogProduct = {
  slug: string;
  name: string;
  tag: string;
  /** Current selling price (whole NGN). */
  price: number;
  /**
   * Optional higher “was” price for promos (Shopify-style compare-at). Must be omitted or strictly greater than `price`.
   * Time-limited promos can be layered later; for now this is a static discount display + checkout amount still uses `price`.
   */
  compareAtPrice?: number;
  lead: string;
  description: string;
  /** Storefront hero (e.g. mannequin shot after Gemini). */
  image: string;
  /** Original listing photo (uploaded before AI); optional for legacy Firestore rows. */
  sourceImage?: string;
  /**
   * Extra PDP gallery images (https), after `image`.
   * When this key is **set** (including `[]`), the storefront does not pad with generic lookbook photos.
   * When **omitted**, legacy behaviour pads thumbnails for a fuller grid.
   */
  galleryImageUrls?: string[];
  /** When set, replaces default PDP “Fitting” accordion body. */
  fittingNotes?: string;
  /** When set, replaces default “Fabric & care” accordion body. */
  fabricCareNotes?: string;
  /** When set, replaces default “Shipping & returns” accordion body. */
  shippingNotes?: string;
  /** When set, replaces default “Craft & fabric” aside paragraph. */
  craftFabricNotes?: string;
  /** Short labels for aside chips (max ~6); falls back to site defaults when empty/omitted. */
  craftFabricLabels?: string[];
  /** Shown under “Colours” when set (fabrics / colourways available on request). */
  colourAvailabilityNotes?: string;
};

function isHttpsUrlString(s: unknown): s is string {
  return typeof s === "string" && s.startsWith("https://") && s.length > 10 && s.length < 2000;
}

const MAX_GALLERY = 6;
const MAX_PDP_NOTE = 4000;
const MAX_LABEL = 100;
const MAX_LABELS = 8;
const MAX_PRICE_NGN = 100_000_000;

function isOptionalPdpNote(s: unknown): boolean {
  return s === undefined || (typeof s === "string" && s.length <= MAX_PDP_NOTE);
}

function isOptionalGalleryImageUrls(v: unknown): boolean {
  if (v === undefined) return true;
  if (!Array.isArray(v) || v.length > MAX_GALLERY) return false;
  return v.every(isHttpsUrlString);
}

function isOptionalCraftFabricLabels(v: unknown): boolean {
  if (v === undefined) return true;
  if (!Array.isArray(v) || v.length > MAX_LABELS) return false;
  return v.every((x) => typeof x === "string" && x.length > 0 && x.length <= MAX_LABEL);
}

function isCatalogProduct(data: unknown): data is CatalogProduct {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (
    !(
      typeof o.slug === "string" &&
      o.slug.length > 0 &&
      typeof o.name === "string" &&
      o.name.length > 0 &&
      typeof o.tag === "string" &&
      o.tag.length > 0 &&
      typeof o.price === "number" &&
      Number.isFinite(o.price) &&
      o.price >= 0 &&
      o.price <= MAX_PRICE_NGN &&
      typeof o.lead === "string" &&
      typeof o.description === "string" &&
      typeof o.image === "string" &&
      o.image.startsWith("https://")
    )
  ) {
    return false;
  }
  if (
    o.sourceImage !== undefined &&
    !(typeof o.sourceImage === "string" && o.sourceImage.startsWith("https://"))
  ) {
    return false;
  }
  if (!isOptionalGalleryImageUrls(o.galleryImageUrls)) return false;
  if (!isOptionalPdpNote(o.fittingNotes)) return false;
  if (!isOptionalPdpNote(o.fabricCareNotes)) return false;
  if (!isOptionalPdpNote(o.shippingNotes)) return false;
  if (!isOptionalPdpNote(o.craftFabricNotes)) return false;
  if (!isOptionalPdpNote(o.colourAvailabilityNotes)) return false;
  if (!isOptionalCraftFabricLabels(o.craftFabricLabels)) return false;
  if (o.compareAtPrice !== undefined) {
    if (typeof o.compareAtPrice !== "number" || !Number.isFinite(o.compareAtPrice)) return false;
    const cap = Math.round(o.compareAtPrice);
    if (cap <= o.price || cap > MAX_PRICE_NGN || cap < 0) return false;
  }
  return true;
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

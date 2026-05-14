import { unstable_cache } from "next/cache";
import {
  describeAdminCredentials,
  getAdminFirestore,
  type AdminCredStatus,
} from "@/lib/firebase-admin-server";
import { sampleProducts } from "@/lib/site";

/** Cache tag for the storefront catalogue. Invalidate after admin write via `revalidateTag(CATALOG_CACHE_TAG, 'max')`. */
export const CATALOG_CACHE_TAG = "catalog";

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

/**
 * Read all `catalog_products` documents via the **firebase-admin** SDK (proper server-side reads).
 *
 * Returns `null` (distinct from `[]`) when Admin credentials are missing or the read throws,
 * so callers can choose to fall back to code defaults instead of treating it as "empty catalogue".
 */
async function fetchFirestoreCatalogUncached(): Promise<CatalogProduct[] | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection("catalog_products").get();
    const out: CatalogProduct[] = [];
    for (const d of snap.docs) {
      const data = d.data();
      if (!isCatalogProduct(data)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[catalog] Skipping catalog_products/${d.id}: failed schema validation.`);
        }
        continue;
      }
      if (data.slug !== d.id) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[catalog] Skipping catalog_products/${d.id}: doc id does not match slug "${data.slug}".`);
        }
        continue;
      }
      out.push(data);
    }
    return out;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[catalog] Firestore read failed: ${msg}`);
    }
    return null;
  }
}

/**
 * Cached wrapper around `fetchFirestoreCatalogUncached` tagged with `CATALOG_CACHE_TAG`.
 * Admin writes call `revalidateTag(CATALOG_CACHE_TAG, 'max')` so newly added products appear
 * on the storefront without waiting for a rebuild.
 */
const fetchFirestoreCatalog = unstable_cache(
  fetchFirestoreCatalogUncached,
  ["catalog_products:all:v1"],
  { tags: [CATALOG_CACHE_TAG], revalidate: 300 },
);

/**
 * Raw Firestore rows (validated). For admin edit links and diagnostics.
 * Returns `[]` (not `null`) so admin tables render even when Firestore is unreachable.
 */
export async function listFirestoreCatalogProducts(): Promise<CatalogProduct[]> {
  return (await fetchFirestoreCatalog()) ?? [];
}

/**
 * Storefront catalogue. **Firestore is the single source of truth on a seeded project.**
 *
 * Behaviour:
 * - Firestore read failed (`null` — usually missing Admin creds): fall back to `sampleProducts`
 *   so the storefront stays up.
 * - Firestore returned rows: those rows win. For any slug in `sampleProducts` that has not yet
 *   been written to Firestore, the code default is included as a transparent fallback so the
 *   storefront keeps showing the bootstrap products before a one-shot migration.
 *
 * Run `npm run catalog:seed` once to push the code defaults into Firestore; from that point on
 * admin owns the catalogue end-to-end (and re-running the seed is a no-op).
 */
export async function getMergedCatalog(): Promise<CatalogProduct[]> {
  const remote = await fetchFirestoreCatalog();
  if (remote === null) {
    return sampleProducts.map((p) => ({ ...p }));
  }
  const remoteSlugs = new Set(remote.map((p) => p.slug));
  const unseededDefaults = sampleProducts
    .filter((p) => !remoteSlugs.has(p.slug))
    .map((p) => ({ ...p }));
  return [...remote, ...unseededDefaults];
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | undefined> {
  const all = await getMergedCatalog();
  return all.find((p) => p.slug === slug);
}

/**
 * Live connection status for the admin diagnostics card. Bypasses the storefront `unstable_cache`
 * so admins always see the *current* state — useful when they've just fixed credentials and want
 * to confirm Firestore is reachable before doing any writes.
 */
export type CatalogConnectionStatus =
  | { ok: true; productCount: number; credStatus: Extract<AdminCredStatus, { ok: true }> }
  | { ok: false; kind: "no-credentials"; credStatus: Extract<AdminCredStatus, { ok: false }> }
  | { ok: false; kind: "read-failed"; detail: string; credStatus: AdminCredStatus };

export async function getCatalogConnectionStatus(): Promise<CatalogConnectionStatus> {
  const credStatus = describeAdminCredentials();
  if (!credStatus.ok) {
    return { ok: false, kind: "no-credentials", credStatus };
  }
  const db = getAdminFirestore();
  if (!db) {
    return {
      ok: false,
      kind: "no-credentials",
      credStatus: {
        ok: false,
        kind: "missing",
        detail:
          "Service-account credential was found but firebase-admin would not initialize. Restart " +
          "the server after correcting FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON.",
      },
    };
  }
  try {
    const snap = await db.collection("catalog_products").count().get();
    return { ok: true, productCount: snap.data().count, credStatus };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ok: false, kind: "read-failed", detail, credStatus };
  }
}

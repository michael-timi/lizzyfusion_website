import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebase-admin-server";
import {
  emptySiteFeatured,
  isSiteFeatured,
  SITE_FEATURED_CACHE_TAG,
  SITE_FEATURED_DOC_PATH,
  type SiteFeatured,
} from "@/lib/site-featured-core";

const SITE_FEATURED_COLLECTION = "site_featured" as const;
const SITE_FEATURED_DOC_ID = "v1" as const;

async function fetchSiteFeaturedUncached(): Promise<SiteFeatured | null> {
  const db = getAdminFirestore();
  if (!db) return null;
  try {
    const snap = await db.collection(SITE_FEATURED_COLLECTION).doc(SITE_FEATURED_DOC_ID).get();
    if (!snap.exists) return emptySiteFeatured();
    const data = snap.data();
    if (!isSiteFeatured(data)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[site-featured] ${SITE_FEATURED_DOC_PATH} failed schema validation; treating as empty.`,
        );
      }
      return emptySiteFeatured();
    }
    return data;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[site-featured] Firestore read failed: ${msg}`);
    }
    return null;
  }
}

/**
 * Cached wrapper. Admin writes call `revalidateTag(SITE_FEATURED_CACHE_TAG)` from the
 * `/api/admin/site-featured/revalidate` route, so pins propagate to the storefront immediately
 * after a save.
 */
const fetchSiteFeatured = unstable_cache(
  fetchSiteFeaturedUncached,
  ["site_featured:v1"],
  { tags: [SITE_FEATURED_CACHE_TAG], revalidate: 300 },
);

/** Storefront read: returns empty pins on any failure so the resolvers always have something. */
export async function getSiteFeatured(): Promise<SiteFeatured> {
  return (await fetchSiteFeatured()) ?? emptySiteFeatured();
}

/** Admin diagnostic read: bypasses cache and distinguishes "no creds / read error" (`null`) from "no doc yet" (empty). */
export async function getSiteFeaturedRaw(): Promise<SiteFeatured | null> {
  return fetchSiteFeaturedUncached();
}

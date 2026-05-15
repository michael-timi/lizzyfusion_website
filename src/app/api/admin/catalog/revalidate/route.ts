import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_CACHE_TAG } from "@/lib/catalog";
import { verifyAdminFromIdToken } from "@/lib/firebase-admin-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only on-demand revalidation for the storefront catalogue. The admin add / edit / delete
 * client UIs POST here after a successful Firestore write, so newly published products appear for
 * everyone (including logged-out visitors) without waiting for the `unstable_cache` TTL.
 *
 * Optional `slug` in the JSON body also revalidates that product’s PDP (`/shop/[slug]`).
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const m = auth?.match(/^Bearer\s+(.+)$/i);
  const idToken = m?.[1]?.trim();
  if (!idToken) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <Firebase ID token>." }, { status: 401 });
  }

  const verified = await verifyAdminFromIdToken(idToken);
  if (!verified.ok) {
    const f = verified.failure;
    const error =
      f.kind === "credentials"
        ? f.detail
        : f.kind === "token"
          ? `ID token rejected: ${f.detail}`
          : f.detail;
    return NextResponse.json({ error }, { status: 403 });
  }

  let slug: string | undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as { slug?: unknown };
    if (typeof body.slug === "string" && /^[a-z0-9-]{1,120}$/.test(body.slug)) {
      slug = body.slug;
    }
  } catch {
    /* missing/invalid body is fine — we still revalidate the tag */
  }

  // expire: 0 evicts the entry immediately so the next request hits Firestore directly. We want
  // the admin's first /shop/[slug] view after save to be fresh; stale-while-revalidate would
  // briefly serve the pre-save (=404) version of the page.
  revalidateTag(CATALOG_CACHE_TAG, { expire: 0 });

  // `revalidateTag` clears `unstable_cache` for `getMergedCatalog()`. Prerendered / ISR HTML
  // for each path must also be invalidated so anonymous visitors (home, lookbook, wishlist, etc.)
  // see new or edited products without waiting for `revalidate: 300` or CDN SWR.
  const catalogPaths = [
    "/",
    "/shop",
    "/wishlist",
    "/lookbook",
    "/sitemap.xml",
    "/api/catalog",
  ] as const;
  for (const p of catalogPaths) {
    revalidatePath(p);
  }
  if (slug) revalidatePath(`/shop/${slug}`);

  return NextResponse.json({ revalidated: true, slug: slug ?? null });
}

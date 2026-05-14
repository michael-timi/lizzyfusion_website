import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { verifyAdminFromIdToken } from "@/lib/firebase-admin-server";
import { SITE_FEATURED_CACHE_TAG } from "@/lib/site-featured";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only on-demand revalidation for the storefront "Featured" pins. The admin /admin/featured
 * page POSTs here after writing `site_featured/v1`, so the next render of /, /shop, or /lookbook
 * reflects the new pins immediately instead of after the `unstable_cache` TTL.
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

  revalidateTag(SITE_FEATURED_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/lookbook");

  return NextResponse.json({ revalidated: true });
}

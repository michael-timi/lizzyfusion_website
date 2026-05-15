import { getCatalogProductBySlug } from "@/lib/catalog";
import { productShareImageUrl } from "@/lib/product-share";
import { publicSiteUrl } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Public product image for link-preview crawlers (WhatsApp, iMessage, Facebook).
 * Proxies a resized asset with crawler-friendly headers — `/_next/image` sets
 * `content-disposition: attachment`, which many crawlers skip for previews.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;
  const product = await getCatalogProductBySlug(slug);
  if (!product?.image?.trim()) {
    return new Response("Not found", { status: 404 });
  }

  const raw = productShareImageUrl(product.image);
  let source = raw;
  try {
    source = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }

  const optimizer = new URL("/_next/image", publicSiteUrl());
  optimizer.searchParams.set("url", source);
  optimizer.searchParams.set("w", "1200");
  optimizer.searchParams.set("q", "75");

  let upstream = await fetch(optimizer.href, { next: { revalidate: 86_400 } });
  if (!upstream.ok) {
    upstream = await fetch(raw, { next: { revalidate: 86_400 } });
  }
  if (!upstream.ok) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = upstream.headers.get("content-type");
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType?.startsWith("image/") ? contentType : "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}

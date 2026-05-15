import type { CatalogProduct } from "@/lib/catalog";
import { catalogDisplayPrice, catalogWhatsappPriceLine } from "@/lib/catalog-pricing";
import { formatNgn, publicSiteUrl, site, whatsappHref } from "@/lib/site";

export type ProductShareInput = Pick<
  CatalogProduct,
  "slug" | "name" | "tag" | "price" | "compareAtPrice" | "styleVariants" | "image"
>;

/** Canonical HTTPS product URL for Open Graph and share sheets. */
export function productShareUrl(slug: string): string {
  return new URL(`/shop/${slug}`, publicSiteUrl()).href;
}

/** Absolute source image URL (Firebase Storage, CDN, or site path). */
export function productShareImageUrl(image: string): string {
  const trimmed = image.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return new URL(trimmed.startsWith("/") ? trimmed : `/${trimmed}`, publicSiteUrl()).href;
}

/**
 * OG / Twitter preview image — served via Next image optimization so crawlers get a
 * smaller public file (Firebase originals are often multi‑MB with `cache-control: private`).
 */
export function productOgImageUrl(image: string): string {
  const source = productShareImageUrl(image);
  const site = publicSiteUrl();
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const params = new URLSearchParams({ url: source, w: "1200", q: "75" });
    return `${site}/_next/image?${params.toString()}`;
  }
  return source;
}

/** Product copy without URL (pair with `productShareUrl` in Web Share API). */
export function productShareBlurb(product: ProductShareInput, styleLabel?: string): string {
  const priceLine = styleLabel
    ? catalogWhatsappPriceLine({ ...product, price: catalogDisplayPrice(product) }, styleLabel)
    : `From ${formatNgn(catalogDisplayPrice(product))}`;
  return [`${product.name} · ${site.name}`, product.tag, priceLine].join("\n");
}

/** Plain-text blurb plus a single canonical URL (WhatsApp, SMS, etc.). */
export function productShareMessage(product: ProductShareInput, styleLabel?: string): string {
  return [productShareBlurb(product, styleLabel), productShareUrl(product.slug)].join("\n");
}

/** WhatsApp deep link with product copy and one URL for link unfurling. */
export function productWhatsappShareHref(product: ProductShareInput, styleLabel?: string): string {
  return whatsappHref(productShareMessage(product, styleLabel));
}

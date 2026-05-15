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

/** Absolute image URL for link-preview crawlers (WhatsApp, iMessage, etc.). */
export function productShareImageUrl(image: string): string {
  const trimmed = image.trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    return trimmed;
  }
  return new URL(trimmed.startsWith("/") ? trimmed : `/${trimmed}`, publicSiteUrl()).href;
}

/** Short plain-text blurb when the user shares or copies a product link. */
export function productShareMessage(product: ProductShareInput, styleLabel?: string): string {
  const url = productShareUrl(product.slug);
  const priceLine = styleLabel
    ? catalogWhatsappPriceLine({ ...product, price: catalogDisplayPrice(product) }, styleLabel)
    : `From ${formatNgn(catalogDisplayPrice(product))}`;
  return [
    `${product.name} · ${site.name}`,
    product.tag,
    priceLine,
    url,
  ].join("\n");
}

/** WhatsApp deep link with product copy and URL (chat apps unfurl the link for previews). */
export function productWhatsappShareHref(product: ProductShareInput, styleLabel?: string): string {
  return whatsappHref(productShareMessage(product, styleLabel));
}

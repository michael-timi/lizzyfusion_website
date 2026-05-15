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
 * OG / Twitter preview image — use the public Firebase (or CDN) URL directly.
 * Avoids `/_next/image` (attachment disposition breaks WhatsApp) and does not require
 * a separate API route at runtime. Storage rules allow public read on catalogue images.
 */
export function productOgImageUrl(image: string): string {
  const raw = productShareImageUrl(image);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
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

export type ProductWhatsappEnquiryOptions = {
  intent?: "product" | "wishlist";
  styleLabel?: string;
  /** PDP: selected size line */
  size?: string;
  /** PDP: zero-based swatch index */
  swatchIndex?: number;
};

/**
 * Pre-filled WhatsApp enquiry copy with exactly one product URL (last line) so chat apps
 * can unfurl the PDP image without duplicating the link in the message body.
 */
export function productEnquiryMessage(
  product: ProductShareInput,
  options: ProductWhatsappEnquiryOptions = {},
): string {
  const intent = options.intent ?? "product";
  const header =
    intent === "wishlist"
      ? `*${site.name} — wishlist enquiry*`
      : `*${site.name} — product enquiry*`;

  const priceLine = options.styleLabel
    ? catalogWhatsappPriceLine(
        { ...product, price: catalogDisplayPrice(product) },
        options.styleLabel,
      )
    : catalogWhatsappPriceLine(product);

  const lines = [header, `Product: ${product.name}`, priceLine];

  if (options.size) {
    lines.push(`Colour preference: swatch ${(options.swatchIndex ?? 0) + 1} (see PDP)`);
    lines.push(`Preferred size: ${options.size}`);
    lines.push("My name and any tweaks (lining, length, sleeves):");
    lines.push("(please fill before sending)");
  } else {
    lines.push("My name / size / colour preference:");
    lines.push("(please fill before sending)");
  }

  lines.push(productShareUrl(product.slug));
  return lines.join("\n");
}

export function productWhatsappEnquiryHref(
  product: ProductShareInput,
  options?: ProductWhatsappEnquiryOptions,
): string {
  return whatsappHref(productEnquiryMessage(product, options));
}

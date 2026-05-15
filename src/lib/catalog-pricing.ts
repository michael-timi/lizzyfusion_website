import type { CatalogProduct } from "@/lib/catalog";
import { catalogListingPrice, productHasStyleVariants } from "@/lib/catalog-style-variants";
import { formatNgn } from "@/lib/site";

/** Minimal fields for sale / strike-through display (Shopify-style compare-at). */
export type CatalogPricePick = Pick<CatalogProduct, "price" | "compareAtPrice" | "styleVariants">;

const MAX_NGN = 100_000_000;

/**
 * Returns a rounded “was” price strictly above `price`, or `undefined` when no valid discount should be shown.
 */
export function effectiveCompareAtPrice(p: CatalogPricePick): number | undefined {
  const raw = p.compareAtPrice;
  const price = productHasStyleVariants(p) ? catalogListingPrice(p as CatalogProduct) : p.price;
  if (raw === undefined || typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  const c = Math.round(raw);
  if (c <= price || c < 0 || c > MAX_NGN) return undefined;
  return c;
}

export function catalogDisplayPrice(p: CatalogPricePick): number {
  return productHasStyleVariants(p) ? catalogListingPrice(p as CatalogProduct) : p.price;
}

export function catalogPriceShowsFrom(p: CatalogPricePick): boolean {
  return productHasStyleVariants(p);
}

/** One line for WhatsApp pre-filled copy (current vs was). */
export function catalogWhatsappPriceLine(p: CatalogPricePick, styleLabel?: string): string {
  const price = p.styleVariants?.length && styleLabel
    ? (p.styleVariants.find((v) => v.label === styleLabel)?.price ?? catalogDisplayPrice(p))
    : catalogDisplayPrice(p);
  const was = effectiveCompareAtPrice({ ...p, price });
  const stylePart = styleLabel ? `Style: ${styleLabel}\n` : "";
  if (was === undefined) return `${stylePart}Listed price: ${formatNgn(price)}`;
  return `${stylePart}Price: ${formatNgn(price)} (was ${formatNgn(was)})`;
}

import type { CatalogProduct } from "@/lib/catalog";
import { formatNgn } from "@/lib/site";

/** Minimal fields for sale / strike-through display (Shopify-style compare-at). */
export type CatalogPricePick = Pick<CatalogProduct, "price" | "compareAtPrice">;

const MAX_NGN = 100_000_000;

/**
 * Returns a rounded “was” price strictly above `price`, or `undefined` when no valid discount should be shown.
 */
export function effectiveCompareAtPrice(p: CatalogPricePick): number | undefined {
  const raw = p.compareAtPrice;
  if (raw === undefined || typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  const c = Math.round(raw);
  if (c <= p.price || c < 0 || c > MAX_NGN) return undefined;
  return c;
}

/** One line for WhatsApp pre-filled copy (current vs was). */
export function catalogWhatsappPriceLine(p: CatalogPricePick): string {
  const was = effectiveCompareAtPrice(p);
  if (was === undefined) return `Listed price: ${formatNgn(p.price)}`;
  return `Price: ${formatNgn(p.price)} (was ${formatNgn(was)})`;
}

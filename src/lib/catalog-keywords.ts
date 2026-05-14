import type { CatalogProduct } from "@/lib/catalog";

/**
 * Single-pick: find the first product in `catalog` whose name / tag / description contains any of
 * the given keywords (case-insensitive substring). Used to resolve themed references — homepage
 * collection tiles, lookbook "shop the look" pairs, mega-nav occasion picks, specialty links —
 * without hard-coding slugs that would break the day an admin renames or deletes a product.
 *
 * Empty `keywords` returns the first product in the catalog (useful as a generic "anything" fallback).
 */
export function pickProductByKeywords(
  catalog: readonly CatalogProduct[],
  keywords: readonly string[],
): CatalogProduct | undefined {
  if (catalog.length === 0) return undefined;
  if (keywords.length === 0) return catalog[0];

  const normalized = keywords.map((k) => k.toLowerCase()).filter((k) => k.length > 0);
  if (normalized.length === 0) return catalog[0];

  for (const k of normalized) {
    for (const p of catalog) {
      const haystack = `${p.name} ${p.tag} ${p.description}`.toLowerCase();
      if (haystack.includes(k)) return p;
    }
  }
  return undefined;
}

/**
 * Pair-pick: resolve two products for "shop the look" style pairings. Each list of keywords is
 * tried in order; if both keyword lists would pick the same product, the second slot tries the
 * next-best match from the remaining catalog.
 */
export function pickProductPairByKeywords(
  catalog: readonly CatalogProduct[],
  pair: readonly [readonly string[], readonly string[]],
): readonly [CatalogProduct, CatalogProduct] | null {
  const a = pickProductByKeywords(catalog, pair[0]);
  if (!a) return null;
  const remaining = catalog.filter((p) => p.slug !== a.slug);
  const b = pickProductByKeywords(remaining, pair[1]);
  if (!b) {
    // Fall back to any second product so the lookbook still renders a pair.
    const any = remaining[0];
    if (!any) return null;
    return [a, any] as const;
  }
  return [a, b] as const;
}

/**
 * URL for a themed entry point. Tries to deep-link to the matching PDP, but falls back to the
 * /shop search results page when there's no match — that way a "Wedding & reception" tile in the
 * homepage still goes somewhere useful even if the relevant product has been retired.
 */
export function hrefForKeywords(
  catalog: readonly CatalogProduct[],
  keywords: readonly string[],
): string {
  const p = pickProductByKeywords(catalog, keywords);
  if (p) return `/shop/${p.slug}`;
  const q = keywords[0]?.trim();
  return q ? `/shop?q=${encodeURIComponent(q)}` : "/shop";
}

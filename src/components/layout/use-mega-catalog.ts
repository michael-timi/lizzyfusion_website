"use client";

import { useEffect, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { pickProductByKeywords } from "@/lib/catalog-keywords";

let cache: readonly CatalogProduct[] | null = null;
let inflight: Promise<readonly CatalogProduct[] | null> | null = null;

/** Fetch the merged catalogue once per page load; subsequent callers reuse the cached array. */
function loadCatalog(): Promise<readonly CatalogProduct[] | null> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/catalog")
      .then((r) => (r.ok ? (r.json() as Promise<{ products?: CatalogProduct[] } | null>) : null))
      .then((body) => {
        const products =
          body?.products && Array.isArray(body.products) ? body.products : null;
        if (products) cache = products;
        return products;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/**
 * Shared live-catalogue source for the storefront mega-nav. Returns `null` until loaded, so callers
 * can fall back to placeholder imagery (see `resolveProductImage`). Cached at module scope so every
 * panel that mounts reuses the same fetch.
 */
export function useMegaCatalog(): readonly CatalogProduct[] | null {
  const [catalog, setCatalog] = useState<readonly CatalogProduct[] | null>(cache);

  useEffect(() => {
    if (catalog) return;
    let cancelled = false;
    void loadCatalog().then((products) => {
      if (!cancelled && products) setCatalog(products);
    });
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  return catalog;
}

/**
 * Pick a *distinct* product per keyword set: each pick excludes products already chosen for earlier
 * sets, so a panel never shows the same dress twice. Empty keyword sets yield `undefined` (so the
 * caller can fall back to a placeholder) instead of greedily claiming the first product.
 */
export function pickDistinctProducts(
  catalog: readonly CatalogProduct[] | null,
  keywordSets: ReadonlyArray<readonly string[]>,
): Array<CatalogProduct | undefined> {
  if (!catalog) return keywordSets.map(() => undefined);
  const used = new Set<string>();
  return keywordSets.map((keywords) => {
    if (keywords.length === 0) return undefined;
    const remaining = catalog.filter((p) => !used.has(p.slug));
    const product = pickProductByKeywords(remaining, keywords);
    if (product) used.add(product.slug);
    return product;
  });
}

/**
 * Resolve a panel's tile images to distinct real uploaded products, falling back to each tile's
 * placeholder when the catalogue hasn't loaded or there's no remaining keyword match.
 */
export function resolveProductImages(
  catalog: readonly CatalogProduct[] | null,
  items: ReadonlyArray<{ keywords: readonly string[]; fallback: string }>,
): string[] {
  if (!catalog) return items.map((i) => i.fallback);
  const picks = pickDistinctProducts(catalog, items.map((i) => i.keywords));
  return items.map((item, i) => picks[i]?.image ?? item.fallback);
}

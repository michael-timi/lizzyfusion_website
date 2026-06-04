import type { CatalogProduct } from "@/lib/catalog";
import { hrefForKeywords, pickProductByKeywords, pickProductPairByKeywords } from "@/lib/catalog-keywords";

/**
 * Document path for the admin-curated "Featured" pins. A single doc — small enough that we always
 * read the whole thing, large enough that we don't want to spread it across the catalogue.
 */
export const SITE_FEATURED_DOC_PATH = "site_featured/v1" as const;

/** `revalidateTag(SITE_FEATURED_CACHE_TAG)` after admin writes so storefront pins refresh instantly. */
export const SITE_FEATURED_CACHE_TAG = "site-featured" as const;

const MAX_PIN_KEY = 120;
const MAX_PIN_SLUG = 120;
const PIN_KEY_REGEX = /^[\w\s&'·\-/]{1,120}$/;
const PIN_SLUG_REGEX = /^[a-z0-9-]{1,120}$/;

/**
 * Admin-curated overrides for storefront pins.
 *
 * Storage-side this is one Firestore doc at {@link SITE_FEATURED_DOC_PATH}. Render-side, the
 * resolvers in this module prefer pins; when a pin is missing or the pinned slug no longer exists,
 * they fall back to the keyword-driven `pickProductByKeywords` from `@/lib/catalog-keywords`.
 *
 * Keys are the human-readable `label` from `landingMedia.collectionTiles` / `landingMedia.lookbook`
 * (e.g. `"Wedding & reception"`, `"Sunday"`). Using labels keeps the admin UI legible without an
 * id table to maintain; the resolvers tolerate label renames by falling back to keywords.
 */
export type SiteFeatured = {
  /** Pinned slug per collection tile, keyed by tile label. */
  collectionTilePins: Record<string, string>;
  /** Pinned slug PAIR per lookbook day, keyed by day label. */
  lookbookPins: Record<string, readonly [string, string]>;
};

function isValidPinKey(key: unknown): key is string {
  return typeof key === "string" && key.length > 0 && key.length <= MAX_PIN_KEY && PIN_KEY_REGEX.test(key);
}

function isValidSlug(s: unknown): s is string {
  return typeof s === "string" && s.length > 0 && s.length <= MAX_PIN_SLUG && PIN_SLUG_REGEX.test(s);
}

export function isSiteFeatured(data: unknown): data is SiteFeatured {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (!o.collectionTilePins || typeof o.collectionTilePins !== "object") return false;
  if (!o.lookbookPins || typeof o.lookbookPins !== "object") return false;
  for (const [k, v] of Object.entries(o.collectionTilePins as Record<string, unknown>)) {
    if (!isValidPinKey(k)) return false;
    if (!isValidSlug(v)) return false;
  }
  for (const [k, v] of Object.entries(o.lookbookPins as Record<string, unknown>)) {
    if (!isValidPinKey(k)) return false;
    if (!Array.isArray(v) || v.length !== 2) return false;
    if (!isValidSlug(v[0]) || !isValidSlug(v[1])) return false;
  }
  return true;
}

/** Empty pins doc — what the resolvers receive when Firestore is unreachable or no admin has saved. */
export function emptySiteFeatured(): SiteFeatured {
  return { collectionTilePins: {}, lookbookPins: {} };
}

/** How a tile/look ended up resolved — useful for the admin preview UI. */
export type ResolutionSource = "pin" | "keywords" | "search-fallback";

/**
 * Pick a product for a collection tile.
 *
 * 1. If the admin pinned a slug and that product is in the live catalogue → use it (`pin`).
 * 2. Otherwise try keyword resolution (`keywords`).
 * 3. Otherwise return a search-results URL using the first keyword (`search-fallback`, no product).
 *
 * The shape mirrors what the homepage / shop hero need: an href, plus the resolved product when
 * available (so the tile can show a price stack or similar later).
 */
export function resolveTileProduct(
  featured: SiteFeatured,
  catalog: readonly CatalogProduct[],
  tile: { label: string; keywords: readonly string[] },
): { product: CatalogProduct | null; href: string; source: ResolutionSource } {
  const pinned = featured.collectionTilePins[tile.label];
  if (pinned) {
    const p = catalog.find((c) => c.slug === pinned);
    if (p) return { product: p, href: `/shop/${p.slug}`, source: "pin" };
  }
  const kw = pickProductByKeywords(catalog, tile.keywords);
  if (kw) return { product: kw, href: `/shop/${kw.slug}`, source: "keywords" };
  return { product: null, href: hrefForKeywords(catalog, tile.keywords), source: "search-fallback" };
}

type TileProductInput = { label: string; keywords: readonly string[] };
type ResolvedTileProduct = { product: CatalogProduct | null; href: string; source: ResolutionSource };

function resolveUnpinnedTileProduct(
  catalog: readonly CatalogProduct[],
  tile: TileProductInput,
): ResolvedTileProduct {
  const kw = pickProductByKeywords(catalog, tile.keywords);
  if (kw) return { product: kw, href: `/shop/${kw.slug}`, source: "keywords" };
  return { product: null, href: hrefForKeywords(catalog, tile.keywords), source: "search-fallback" };
}

/**
 * Resolve a group of collection tiles together, reserving each keyword/fallback product as it is
 * chosen so later tiles can pick the next-best distinct catalogue product.
 *
 * Admin pins remain authoritative: a live pinned product is used even if an earlier tile already
 * resolved to the same slug. For non-pinned tiles, we try an unused keyword match first, then the
 * next unused catalogue product as a fallback. Duplicates are only allowed after every distinct
 * catalogue product has already been used.
 */
export function resolveTileProducts(
  featured: SiteFeatured,
  catalog: readonly CatalogProduct[],
  tiles: readonly TileProductInput[],
): ResolvedTileProduct[] {
  const usedSlugs = new Set<string>();

  return tiles.map((tile) => {
    const pinned = featured.collectionTilePins[tile.label];
    if (pinned) {
      const p = catalog.find((c) => c.slug === pinned);
      if (p) {
        usedSlugs.add(p.slug);
        return { product: p, href: `/shop/${p.slug}`, source: "pin" };
      }
    }

    const unusedCatalog = catalog.filter((p) => !usedSlugs.has(p.slug));
    const unusedKeywordMatch = pickProductByKeywords(unusedCatalog, tile.keywords);
    const resolved =
      unusedKeywordMatch
        ? { product: unusedKeywordMatch, href: `/shop/${unusedKeywordMatch.slug}`, source: "keywords" as const }
        : unusedCatalog[0]
          ? { product: unusedCatalog[0], href: `/shop/${unusedCatalog[0].slug}`, source: "search-fallback" as const }
          : resolveUnpinnedTileProduct(catalog, tile);
    if (resolved.product) usedSlugs.add(resolved.product.slug);
    return resolved;
  });
}

/**
 * Resolve everything a collection tile needs to render: link `href`, plus the `image`/`alt` of the
 * resolved product. When a tile resolves to a live product (pin or keywords), the storefront should
 * show THAT product's photo — not the static placeholder art on the tile — so the image matches the
 * PDP the tile links to. Falls back to the tile's own `image`/`label` only when no product resolves.
 *
 * Shared by the homepage "Collection" tiles and the Shop-all dual hero so both surfaces stay in sync.
 */
export function resolveTileMedia(
  featured: SiteFeatured,
  catalog: readonly CatalogProduct[],
  tile: { label: string; keywords: readonly string[]; image: string },
): { product: CatalogProduct | null; href: string; image: string; alt: string; source: ResolutionSource } {
  const resolved = resolveTileProduct(featured, catalog, tile);
  return {
    product: resolved.product,
    href: resolved.href,
    image: resolved.product?.image ?? tile.image,
    alt: resolved.product?.name ?? tile.label,
    source: resolved.source,
  };
}

type TileMediaInput = TileProductInput & { image: string };
type ResolvedTileMedia = ResolvedTileProduct & { image: string; alt: string };

export function resolveTileMediaList(
  featured: SiteFeatured,
  catalog: readonly CatalogProduct[],
  tiles: readonly TileMediaInput[],
): ResolvedTileMedia[] {
  const resolvedProducts = resolveTileProducts(featured, catalog, tiles);
  return tiles.map((tile, index) => {
    const resolved = resolvedProducts[index];
    return {
      product: resolved.product,
      href: resolved.href,
      image: resolved.product?.image ?? tile.image,
      alt: resolved.product?.name ?? tile.label,
      source: resolved.source,
    };
  });
}

/**
 * Pick the "shop the look" pair for a lookbook day.
 *
 * 1. Both pins resolve to live products → use them (`pin`).
 * 2. Pins missing or stale → fall back to `pickProductPairByKeywords` (`keywords`).
 * 3. Catalogue is empty → return `null`.
 *
 * Partial pins (e.g. only the first slot pinned) are intentionally NOT supported: the admin pins
 * a complete pair or doesn't pin. Keeps the data model and the UI simple.
 */
export function resolveLookPair(
  featured: SiteFeatured,
  catalog: readonly CatalogProduct[],
  look: { label: string; shopKeywords: readonly [readonly string[], readonly string[]] },
): { pair: readonly [CatalogProduct, CatalogProduct] | null; source: ResolutionSource } {
  const pinned = featured.lookbookPins[look.label];
  if (pinned) {
    const a = catalog.find((c) => c.slug === pinned[0]);
    const b = catalog.find((c) => c.slug === pinned[1]);
    if (a && b && a.slug !== b.slug) {
      return { pair: [a, b] as const, source: "pin" };
    }
  }
  const kw = pickProductPairByKeywords(catalog, look.shopKeywords);
  if (kw) return { pair: kw, source: "keywords" };
  return { pair: null, source: "search-fallback" };
}

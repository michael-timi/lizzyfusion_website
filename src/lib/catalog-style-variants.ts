import type { CatalogProduct } from "@/lib/catalog";

/** One dress style / length tier with its own price (and optional hero image on the PDP). */
export type CatalogStyleVariant = {
  /** Stable id (e.g. full-long, short, children). */
  id: string;
  label: string;
  price: number;
  compareAtPrice?: number;
  /** Optional https image for this style; shown in the PDP gallery. */
  image?: string;
};

export const MAX_STYLE_VARIANTS = 6;

export const DEFAULT_STYLE_VARIANT_PRESETS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "full-long", label: "Full long gown" },
  { id: "short", label: "Short gown" },
  { id: "children", label: "Children" },
] as const;

const MAX_VARIANT_ID = 40;
const MAX_VARIANT_LABEL = 120;
export const MAX_PRICE_NGN = 100_000_000;

function isHttpsUrl(s: unknown): s is string {
  return typeof s === "string" && s.startsWith("https://") && s.length > 10 && s.length <= 8192;
}

function isWholeNaira(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n === Math.round(n) && n >= 0 && n <= MAX_PRICE_NGN;
}

export function slugifyStyleVariantId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_VARIANT_ID);
}

export function isCatalogStyleVariant(v: unknown): v is CatalogStyleVariant {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id.length < 1 || o.id.length > MAX_VARIANT_ID) return false;
  if (typeof o.label !== "string" || o.label.length < 1 || o.label.length > MAX_VARIANT_LABEL) return false;
  if (!isWholeNaira(o.price)) return false;
  if (o.compareAtPrice !== undefined) {
    if (!isWholeNaira(o.compareAtPrice)) return false;
    if (Math.round(o.compareAtPrice as number) <= (o.price as number)) return false;
  }
  if (o.image !== undefined && !isHttpsUrl(o.image)) return false;
  return true;
}

export function normalizeStyleVariants(list: unknown): CatalogStyleVariant[] | undefined {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  const out: CatalogStyleVariant[] = [];
  const seen = new Set<string>();
  for (const row of list) {
    if (!isCatalogStyleVariant(row)) continue;
    const id = slugifyStyleVariantId(row.id) || slugifyStyleVariantId(row.label);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      label: row.label.trim(),
      price: Math.round(row.price),
      ...(row.compareAtPrice !== undefined ? { compareAtPrice: Math.round(row.compareAtPrice) } : {}),
      ...(row.image ? { image: row.image.trim() } : {}),
    });
    if (out.length >= MAX_STYLE_VARIANTS) break;
  }
  return out.length > 0 ? out : undefined;
}

export function productHasStyleVariants(product: Pick<CatalogProduct, "styleVariants">): boolean {
  return Boolean(product.styleVariants && product.styleVariants.length > 0);
}

export function minVariantPrice(variants: CatalogStyleVariant[]): number {
  return Math.min(...variants.map((v) => v.price));
}

/** Listing / default price: lowest variant price when variants exist. */
export function catalogListingPrice(product: CatalogProduct): number {
  if (productHasStyleVariants(product) && product.styleVariants) {
    return minVariantPrice(product.styleVariants);
  }
  return product.price;
}

export function getStyleVariantById(
  product: CatalogProduct,
  id: string | null | undefined,
): CatalogStyleVariant | undefined {
  if (!id || !product.styleVariants) return undefined;
  return product.styleVariants.find((v) => v.id === id);
}

/** One gallery image tagged with one or more dress styles shown in that photo (e.g. long + short together). */
export type GalleryStyleLink = {
  image: string;
  styleIds: string[];
};

export type PdpGallery = {
  urls: string[];
  /** Style variant ids for each gallery index (empty = no style tie; multiple = comparison / combo photo). */
  variantIdsByIndex: string[][];
};

function normalizeGalleryStyleLinks(
  links: unknown,
  validStyleIds: Set<string>,
): GalleryStyleLink[] | undefined {
  if (!Array.isArray(links) || links.length === 0) return undefined;
  const out: GalleryStyleLink[] = [];
  const seenImages = new Set<string>();
  for (const row of links) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (!isHttpsUrl(o.image) || seenImages.has(o.image)) continue;
    if (!Array.isArray(o.styleIds) || o.styleIds.length === 0) continue;
    const styleIds: string[] = [];
    for (const raw of o.styleIds) {
      if (typeof raw !== "string") continue;
      const id = slugifyStyleVariantId(raw);
      if (!id || !validStyleIds.has(id) || styleIds.includes(id)) continue;
      styleIds.push(id);
      if (styleIds.length >= MAX_STYLE_VARIANTS) break;
    }
    if (styleIds.length === 0) continue;
    seenImages.add(o.image);
    out.push({ image: o.image, styleIds });
    if (out.length >= 6) break;
  }
  return out.length > 0 ? out : undefined;
}

/** Resolve which style ids apply to a gallery image (explicit links beat single-variant image match). */
export function styleIdsForGalleryImage(
  product: CatalogProduct,
  imageUrl: string,
): string[] {
  const variants = product.styleVariants ?? [];
  if (variants.length === 0) return [];

  const validIds = new Set(variants.map((v) => v.id));
  const links = normalizeGalleryStyleLinks(product.galleryStyleLinks, validIds);
  const explicit = links?.find((l) => l.image === imageUrl);
  if (explicit) return explicit.styleIds;

  const solo = variants.find((v) => v.image === imageUrl);
  return solo ? [solo.id] : [];
}

/** Build PDP gallery and map thumbnails to one or more style variants per image. */
export function buildPdpGallery(product: CatalogProduct): PdpGallery {
  const urls: string[] = [];
  const variantIdsByIndex: string[][] = [];

  const push = (url: string, styleIds: string[]) => {
    if (!isHttpsUrl(url)) return;
    const ids = [...new Set(styleIds)].filter((id) =>
      product.styleVariants?.some((v) => v.id === id),
    );
    const idx = urls.indexOf(url);
    if (idx >= 0) {
      if (ids.length > 0) variantIdsByIndex[idx] = ids;
      return;
    }
    if (urls.length >= 6) return;
    urls.push(url);
    variantIdsByIndex.push(ids);
  };

  const variants = product.styleVariants ?? [];

  if (variants.length > 0) {
    push(product.image, styleIdsForGalleryImage(product, product.image));
    for (const v of variants) {
      if (v.image) push(v.image, styleIdsForGalleryImage(product, v.image));
    }
    if ("galleryImageUrls" in product && product.galleryImageUrls !== undefined) {
      for (const u of product.galleryImageUrls) {
        push(u, styleIdsForGalleryImage(product, u));
      }
    }
    if (urls.length === 0) push(product.image, variants[0] ? [variants[0].id] : []);
    return { urls, variantIdsByIndex };
  }

  push(product.image, []);
  if ("galleryImageUrls" in product && product.galleryImageUrls !== undefined) {
    for (const u of product.galleryImageUrls) push(u, []);
  }
  return { urls, variantIdsByIndex };
}

/** @deprecated Use variantIdsByIndex — first id or null. */
export function primaryVariantIdForIndex(variantIdsByIndex: string[][], index: number): string | null {
  const ids = variantIdsByIndex[index];
  return ids?.[0] ?? null;
}

export type CatalogPriceView = Pick<CatalogProduct, "price" | "compareAtPrice">;

/** Price block for a selected variant, or the product default. */
export function priceViewForSelection(
  product: CatalogProduct,
  variantId: string | null,
): CatalogPriceView {
  const v = getStyleVariantById(product, variantId);
  if (v) return { price: v.price, compareAtPrice: v.compareAtPrice };
  if (productHasStyleVariants(product) && product.styleVariants?.[0]) {
    const first = product.styleVariants[0];
    return { price: first.price, compareAtPrice: first.compareAtPrice };
  }
  return { price: product.price, compareAtPrice: product.compareAtPrice };
}

/** When saving admin payload: set listing `price` to min variant price. */
export function withListingPriceFromVariants(
  payload: CatalogProduct,
  variants: CatalogStyleVariant[] | undefined,
  galleryStyleLinks?: GalleryStyleLink[],
): CatalogProduct {
  if (!variants?.length) {
    const { styleVariants: _s, galleryStyleLinks: _g, ...rest } = payload;
    return rest as CatalogProduct;
  }
  const { compareAtPrice: _c, styleVariants: _sv, galleryStyleLinks: _gl, ...rest } = payload;
  const base: CatalogProduct = {
    ...rest,
    styleVariants: variants,
    price: minVariantPrice(variants),
  };
  if (galleryStyleLinks?.length) return { ...base, galleryStyleLinks };
  return base;
}

export function uniqueLinkableGalleryUrls(heroUrl: string, galleryUrls?: string[]): string[] {
  const out: string[] = [];
  const push = (u: string) => {
    if (isHttpsUrl(u) && !out.includes(u)) out.push(u);
  };
  push(heroUrl);
  if (galleryUrls) for (const u of galleryUrls) push(u);
  return out.slice(0, 6);
}

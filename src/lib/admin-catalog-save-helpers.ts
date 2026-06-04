import type { FirebaseStorage } from "firebase/storage";
import { uploadCatalogProductGalleryImage, uploadCatalogProductHeroImage } from "@/lib/catalog-product-image-upload";
import type { CatalogProduct } from "@/lib/catalog";
import type { CatalogStyleVariant } from "@/lib/catalog-style-variants";
import { normalizeStyleVariants, slugifyStyleVariantId } from "@/lib/catalog-style-variants";
import type { StyleVariantDraft } from "@/components/admin/admin-style-variants-fields";

export const CATALOG_RULE_LIMITS = {
  maxPriceNgn: 100_000_000,
  slugMaxExclusive: 120,
  nameMaxExclusive: 200,
  tagMaxExclusive: 120,
  leadMax: 4000,
  descriptionMax: 20_000,
  pdpNoteMax: 4000,
} as const;

type CatalogRuleDraftText = Pick<CatalogProduct, "name" | "tag" | "lead" | "description"> &
  Partial<
    Pick<
      CatalogProduct,
      "fittingNotes" | "fabricCareNotes" | "shippingNotes" | "craftFabricNotes" | "colourAvailabilityNotes"
    >
  >;

export function validateCatalogTextForFirestoreRules(data: CatalogRuleDraftText): string | null {
  if (!data.name.trim() || !data.tag.trim() || !data.lead.trim() || !data.description.trim()) {
    return "Name, collection tag, lead time, and description are required.";
  }
  if (data.name.trim().length >= CATALOG_RULE_LIMITS.nameMaxExclusive) {
    return "Product name must be under 200 characters (Firestore catalogue limit).";
  }
  if (data.tag.trim().length >= CATALOG_RULE_LIMITS.tagMaxExclusive) {
    return "Collection tag must be under 120 characters.";
  }
  if (data.lead.trim().length > CATALOG_RULE_LIMITS.leadMax) {
    return "Lead time / fulfilment copy must be at most 4,000 characters.";
  }
  if (data.description.trim().length > CATALOG_RULE_LIMITS.descriptionMax) {
    return "Description must be at most 20,000 characters.";
  }

  const optionalNotes: Array<[label: string, value: string | undefined]> = [
    ["Fitting section", data.fittingNotes],
    ["Fabric & care section", data.fabricCareNotes],
    ["Shipping & returns section", data.shippingNotes],
    ["Craft & fabric panel", data.craftFabricNotes],
    ["Colours / fabric availability", data.colourAvailabilityNotes],
  ];
  for (const [label, value] of optionalNotes) {
    if (value?.trim() && value.trim().length > CATALOG_RULE_LIMITS.pdpNoteMax) {
      return `${label} must be at most 4,000 characters.`;
    }
  }

  return null;
}

export function validateCatalogSlugForFirestoreRules(slug: string): string | null {
  if (slug.length < 2) {
    return "Enter a valid slug (letters, numbers, hyphens) or a product name to derive one.";
  }
  if (slug.length >= CATALOG_RULE_LIMITS.slugMaxExclusive) {
    return "Product slug must be under 120 characters (Firestore catalogue limit). Shorten the slug and try again.";
  }
  return null;
}

export function validateCatalogPriceForFirestoreRules(
  price: number,
  compareAtPrice: number | undefined,
): string | null {
  if (!Number.isFinite(price) || price !== Math.round(price) || price < 0) {
    return "Price must be a non-negative whole Naira amount.";
  }
  if (price > CATALOG_RULE_LIMITS.maxPriceNgn) {
    return "Price must be at most ₦100,000,000 (Firestore catalogue limit).";
  }
  if (compareAtPrice !== undefined) {
    if (
      !Number.isFinite(compareAtPrice) ||
      compareAtPrice !== Math.round(compareAtPrice) ||
      compareAtPrice < 0 ||
      compareAtPrice > CATALOG_RULE_LIMITS.maxPriceNgn ||
      compareAtPrice <= price
    ) {
      return "Compare-at price must be a whole Naira amount greater than price and at most ₦100,000,000.";
    }
  }
  return null;
}

export function validateCatalogImageUrlForFirestoreRules(label: string, url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://") || trimmed.length <= 10) {
    return `${label} must be an https URL.`;
  }
  if (trimmed.length > 8192) {
    return `${label} URL must be at most 8,192 characters.`;
  }
  return null;
}

/** Firestore rejects `undefined` field values — omit those keys before setDoc. */
export function catalogDocForFirestore(data: CatalogProduct): CatalogProduct {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    out[key] = value;
  }
  return out as CatalogProduct;
}

export function parseNairaWhole(raw: string): number | null {
  const n = Math.round(Number(raw.replace(/,/g, "").trim()));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export async function buildStyleVariantsForSave(
  drafts: StyleVariantDraft[],
  storage: FirebaseStorage,
  uid: string,
  slug: string,
): Promise<CatalogStyleVariant[]> {
  const built: CatalogStyleVariant[] = [];
  for (const row of drafts) {
    const label = row.label.trim();
    if (!label) continue;
    const price = parseNairaWhole(row.priceStr);
    if (price === null) throw new Error(`Each dress style needs a valid price (₦). Check “${label || "style"}”.`);

    let compareAtPrice: number | undefined;
    const compareRaw = row.compareAtStr.trim();
    if (compareRaw.length > 0) {
      const cap = parseNairaWhole(compareRaw);
      if (cap === null || cap <= price) {
        throw new Error(
          `Compare-at for “${label}” must be a whole Naira amount strictly greater than that style’s price, or leave it blank.`,
        );
      }
      compareAtPrice = cap;
    }

    let image: string | undefined;
    if (row.imageFile) {
      const up = await uploadCatalogProductHeroImage(storage, uid, slug, row.imageFile);
      image = up.downloadUrl;
    } else if (row.imageUrl.trim().startsWith("https://")) {
      image = row.imageUrl.trim();
    }

    const id = slugifyStyleVariantId(row.id) || slugifyStyleVariantId(label);
    if (!id) throw new Error(`Could not derive an id for style “${label}”.`);

    built.push({
      id,
      label,
      price,
      ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
      ...(image ? { image } : {}),
    });
  }

  const normalized = normalizeStyleVariants(built);
  if (!normalized?.length) {
    throw new Error("Add at least one dress style with a label and price, or turn off multiple styles.");
  }
  return normalized;
}

export async function uploadGalleryFiles(
  storage: FirebaseStorage,
  uid: string,
  slug: string,
  files: File[],
  maxTotal: number,
  existingCount: number,
): Promise<string[]> {
  const urls: string[] = [];
  const room = Math.max(0, maxTotal - existingCount);
  for (const f of files.slice(0, room)) {
    const g = await uploadCatalogProductGalleryImage(storage, uid, slug, f);
    urls.push(g.downloadUrl);
  }
  return urls;
}

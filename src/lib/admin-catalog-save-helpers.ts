import type { FirebaseStorage } from "firebase/storage";
import { uploadCatalogProductGalleryImage, uploadCatalogProductHeroImage } from "@/lib/catalog-product-image-upload";
import type { CatalogProduct } from "@/lib/catalog";
import type { CatalogStyleVariant } from "@/lib/catalog-style-variants";
import { normalizeStyleVariants, slugifyStyleVariantId } from "@/lib/catalog-style-variants";
import type { StyleVariantDraft } from "@/components/admin/admin-style-variants-fields";

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

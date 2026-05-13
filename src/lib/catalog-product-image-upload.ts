import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";

const MAX_BYTES = 5 * 1024 * 1024;

function safeFileSegment(name: string): string {
  const trimmed = name.trim().slice(0, 80) || "image";
  return trimmed.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "") || "image";
}

/**
 * Upload a catalogue hero image for `catalog_products/{slug}`.
 * Storage path: `users/{uid}/catalog_product_images/{slug}/…` (public read; see storage.rules).
 */
export async function uploadCatalogProductHeroImage(
  storage: FirebaseStorage,
  uid: string,
  slug: string,
  file: File,
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (JPEG, PNG, WebP, etc.).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
  const segment = `${Date.now()}_${safeFileSegment(file.name)}`;
  const storagePath = `users/${uid}/catalog_product_images/${slug}/${segment}`;
  const r = ref(storage, storagePath);
  await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
  const downloadUrl = await getDownloadURL(r);
  return { downloadUrl, storagePath };
}

export async function deleteCatalogProductHeroImage(storage: FirebaseStorage, storagePath: string): Promise<void> {
  await deleteObject(ref(storage, storagePath));
}

const MAX_EDGE_PX = 1600;
const JPEG_QUALITY = 0.85;
/** Skip re-encoding when already small enough for PDP + link previews. */
const SKIP_BELOW_BYTES = 450_000;

/**
 * Resize and re-encode catalogue uploads in the browser so Storage objects stay
 * crawler-friendly (WhatsApp / OG) without multi‑MB PNGs.
 */
export async function compressCatalogImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= SKIP_BELOW_BYTES && file.type === "image/jpeg") return file;
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > MAX_EDGE_PX ? MAX_EDGE_PX / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/i, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

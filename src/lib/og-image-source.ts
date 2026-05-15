import { publicSiteUrl } from "@/lib/site";

const ALLOWED_IMAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "images.unsplash.com",
]);

export function decodeImageSource(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export function isAllowedOgImageSource(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) return true;
    return parsed.hostname === new URL(publicSiteUrl()).hostname;
  } catch {
    return false;
  }
}

/**
 * Firebase download URLs from `getDownloadURL()` use literal `/` in the object path;
 * the REST API requires the path segment after `/o/` to be fully encoded (`%2F`).
 */
export function normalizeFirebaseStorageDownloadUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "firebasestorage.googleapis.com" && parsed.hostname !== "storage.googleapis.com") {
      return url;
    }

    const prefix = "/v0/b/";
    const oMarker = "/o/";
    const path = parsed.pathname;
    const bucketStart = path.indexOf(prefix);
    const objectStart = path.indexOf(oMarker, bucketStart);
    if (bucketStart === -1 || objectStart === -1) return url;

    const objectPath = path.slice(objectStart + oMarker.length);
    if (!objectPath || objectPath.includes("%2F")) return url;

    const encodedObject = encodeURIComponent(objectPath);
    parsed.pathname = `${path.slice(0, objectStart + oMarker.length)}${encodedObject}`;
    return parsed.href;
  } catch {
    return url;
  }
}

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

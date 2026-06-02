import {
  decodeImageSource,
  isAllowedOgImageSource,
  normalizeFirebaseStorageDownloadUrl,
} from "@/lib/og-image-source";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OG_MAX_WIDTH = 1200;
const OG_JPEG_QUALITY = 82;
const FETCH_TIMEOUT_MS = 20_000;

async function resizeForOgPreview(source: string): Promise<Buffer | null> {
  const fetchUrl = normalizeFirebaseStorageDownloadUrl(source);
  const upstream = await fetch(fetchUrl, {
    cache: "force-cache",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!upstream.ok) return null;

  const input = Buffer.from(await upstream.arrayBuffer());
  return sharp(input)
    .rotate()
    .resize({ width: OG_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: OG_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

/**
 * Public image proxy for link-preview crawlers (WhatsApp, iMessage, Facebook).
 * `?url=` must be an allowlisted https image URL (encoded once).
 */
export async function GET(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) {
    return new Response("Missing url", { status: 400 });
  }

  const source = decodeImageSource(raw);
  if (!source || !isAllowedOgImageSource(source)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await resizeForOgPreview(source);
    if (!body) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

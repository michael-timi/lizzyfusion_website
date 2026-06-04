import {
  decodeImageSource,
  isAllowedOgImageSource,
  normalizeFirebaseStorageDownloadUrl,
} from "@/lib/og-image-source";
import { watermarkImage } from "@/lib/watermark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FETCH_TIMEOUT_MS = 20_000;
const MAX_REQUESTED_WIDTH = 1600;

function parseWidth(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(n, MAX_REQUESTED_WIDTH);
}

/**
 * Public catalogue image proxy that stamps the Lizzy Fusion brand wordmark.
 * `?src=` must be an allowlisted https image URL (encoded once); `?w=` is optional.
 *
 * Masters stay clean in Storage — only this watermarked derivative is linked
 * from the storefront, so any image a visitor saves carries the brand. On any
 * processing failure we redirect to the clean original so the image still shows.
 */
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const raw = params.get("src");
  if (!raw) {
    return new Response("Missing src", { status: 400 });
  }

  const source = decodeImageSource(raw);
  if (!source || !isAllowedOgImageSource(source)) {
    return new Response("Forbidden", { status: 403 });
  }

  const fetchUrl = normalizeFirebaseStorageDownloadUrl(source);
  const width = parseWidth(params.get("w"));

  try {
    const upstream = await fetch(fetchUrl, {
      cache: "force-cache",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!upstream.ok) {
      return Response.redirect(fetchUrl, 302);
    }

    const input = Buffer.from(await upstream.arrayBuffer());
    const output = await watermarkImage(input, width);

    return new Response(new Uint8Array(output), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    // Never break the storefront image: fall back to the clean original.
    return Response.redirect(fetchUrl, 302);
  }
}

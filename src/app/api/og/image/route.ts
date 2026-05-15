import { productShareImageUrl } from "@/lib/product-share";
import { publicSiteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "images.unsplash.com",
]);

function isAllowedImageSource(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) return true;
    return parsed.hostname === new URL(publicSiteUrl()).hostname;
  } catch {
    return false;
  }
}

function decodeImageSource(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

async function proxyOptimizedImage(source: string): Promise<Response | null> {
  const optimizer = new URL("/_next/image", publicSiteUrl());
  optimizer.searchParams.set("url", source);
  optimizer.searchParams.set("w", "1200");
  optimizer.searchParams.set("q", "75");

  const upstream = await fetch(optimizer.href, { cache: "force-cache" });
  if (!upstream.ok) return null;

  const contentType = upstream.headers.get("content-type");
  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType?.startsWith("image/") ? contentType : "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}

async function proxyDirectImage(source: string): Promise<Response | null> {
  const upstream = await fetch(source, { cache: "force-cache" });
  if (!upstream.ok) return null;

  const contentType = upstream.headers.get("content-type");
  if (!contentType?.startsWith("image/")) return null;

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
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
  if (!source || !isAllowedImageSource(source)) {
    return new Response("Forbidden", { status: 403 });
  }

  const optimized = await proxyOptimizedImage(source);
  if (optimized) return optimized;

  const direct = await proxyDirectImage(source);
  if (direct) return direct;

  return new Response("Not found", { status: 404 });
}

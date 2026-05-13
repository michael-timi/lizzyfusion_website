import { NextResponse } from "next/server";
import { verifyAdminFromIdToken } from "@/lib/firebase-admin-server";
import { parseGeminiFailure } from "@/lib/gemini-errors";
import { generateProductSuggestionsFromHeroImage } from "@/lib/gemini-catalog-suggest-from-hero";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Add it in .env.local (from Google AI Studio → API keys)." },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  const m = auth?.match(/^Bearer\s+(.+)$/i);
  const idToken = m?.[1]?.trim();
  if (!idToken) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <Firebase ID token>." }, { status: 401 });
  }

  const verified = await verifyAdminFromIdToken(idToken);
  if (!verified.ok) {
    const f = verified.failure;
    const error =
      f.kind === "credentials"
        ? f.detail
        : f.kind === "token"
          ? `ID token rejected: ${f.detail}`
          : f.detail;
    return NextResponse.json({ error }, { status: 403 });
  }

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data with field \"image\"." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing \"image\" file field." }, { status: 400 });
  }

  const mimeType = (file.type || "application/octet-stream").toLowerCase();
  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json({ error: "Image must be JPEG, PNG, WebP, or GIF." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 256) {
    return NextResponse.json({ error: "Image file is too small." }, { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
  }

  try {
    const suggestions = await generateProductSuggestionsFromHeroImage(buf, mimeType);
    return NextResponse.json({ suggestions });
  } catch (e) {
    const { userMessage, httpStatus, retryAfterSec } = parseGeminiFailure(e);
    const headers =
      httpStatus === 429 && retryAfterSec !== undefined
        ? { "Retry-After": String(retryAfterSec) }
        : undefined;
    return NextResponse.json({ error: userMessage, retryAfterSec }, { status: httpStatus, headers });
  }
}

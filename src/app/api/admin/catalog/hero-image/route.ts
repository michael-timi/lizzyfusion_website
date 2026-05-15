import { NextResponse } from "next/server";
import { verifyAdminFromIdToken } from "@/lib/firebase-admin-server";
import { parseGeminiFailure } from "@/lib/gemini-errors";
import {
  generateMannequinHeroImage,
  type CameraAngle,
  type DressCategory,
  type GarmentAudience,
  type MannequinStyle,
  type PositionStyle,
  type StudioBackground,
  type StudioLighting,
} from "@/lib/gemini-catalog-hero";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function parseAudience(raw: string | null): GarmentAudience {
  if (raw === "child" || raw === "adult" || raw === "unspecified") return raw;
  return "unspecified";
}

function parseDressCategory(raw: string | null): DressCategory {
  if (
    raw === "auto" ||
    raw === "evening-gown" ||
    raw === "cocktail-dress" ||
    raw === "bridal-dress" ||
    raw === "casual-dress" ||
    raw === "maxi-dress" ||
    raw === "midi-dress" ||
    raw === "mini-dress" ||
    raw === "kaftan" ||
    raw === "aso-ebi"
  ) {
    return raw;
  }
  return "auto";
}

function parseMannequinStyle(raw: string | null): MannequinStyle {
  if (
    raw === "auto-varied" ||
    raw === "cream-female" ||
    raw === "matte-black" ||
    raw === "wooden-dress-form" ||
    raw === "headless-white"
  ) {
    return raw;
  }
  return "auto-varied";
}

function parseBackground(raw: string | null): StudioBackground {
  if (raw === "soft-grey" || raw === "pure-white" || raw === "luxury-boutique" || raw === "sunlit-atelier") {
    return raw;
  }
  return "soft-grey";
}

function parseLighting(raw: string | null): StudioLighting {
  if (raw === "softbox" || raw === "editorial" || raw === "natural-daylight") return raw;
  return "softbox";
}

function parseCameraAngle(raw: string | null): CameraAngle {
  if (raw === "front" || raw === "three-quarter") return raw;
  return "front";
}

function parsePositionStyle(raw: string | null): PositionStyle {
  if (
    raw === "auto-varied" ||
    raw === "classic-straight" ||
    raw === "soft-contrapposto" ||
    raw === "runway-step" ||
    raw === "arms-away" ||
    raw === "atelier-display"
  ) {
    return raw;
  }
  return "auto-varied";
}

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

  const audience = parseAudience(typeof form.get("audience") === "string" ? (form.get("audience") as string) : null);
  const dressCategory = parseDressCategory(
    typeof form.get("dressCategory") === "string" ? (form.get("dressCategory") as string) : null,
  );
  const mannequinStyle = parseMannequinStyle(
    typeof form.get("mannequinStyle") === "string" ? (form.get("mannequinStyle") as string) : null,
  );
  const background = parseBackground(typeof form.get("background") === "string" ? (form.get("background") as string) : null);
  const lighting = parseLighting(typeof form.get("lighting") === "string" ? (form.get("lighting") as string) : null);
  const cameraAngle = parseCameraAngle(
    typeof form.get("cameraAngle") === "string" ? (form.get("cameraAngle") as string) : null,
  );
  const positionStyle = parsePositionStyle(
    typeof form.get("positionStyle") === "string" ? (form.get("positionStyle") as string) : null,
  );
  const notes = typeof form.get("notes") === "string" ? (form.get("notes") as string) : undefined;

  try {
    const out = await generateMannequinHeroImage(buf, mimeType, {
      audience,
      dressCategory,
      mannequinStyle,
      background,
      lighting,
      cameraAngle,
      positionStyle,
      extraNotes: notes,
    });
    return NextResponse.json({
      imageBase64: out.imageBase64,
      mimeType: out.mimeType,
      model: out.model,
    });
  } catch (e) {
    const { userMessage, httpStatus, retryAfterSec } = parseGeminiFailure(e);
    const headers =
      retryAfterSec !== undefined && (httpStatus === 429 || httpStatus === 503)
        ? { "Retry-After": String(retryAfterSec) }
        : undefined;
    return NextResponse.json({ error: userMessage, retryAfterSec }, { status: httpStatus, headers });
  }
}

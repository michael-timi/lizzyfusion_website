import { GoogleGenAI, createPartFromBase64, createPartFromText } from "@google/genai";
import {
  DEFAULT_STYLE_VARIANT_PRESETS,
  slugifyStyleVariantId,
} from "@/lib/catalog-style-variants";
import type {
  CameraAngle,
  DressCategory,
  GarmentAudience,
  MannequinStyle,
  PositionStyle,
  StudioBackground,
  StudioLighting,
} from "@/lib/gemini-catalog-hero";

/** Text + vision model (not the image-generation model). */
const MODEL = "gemini-2.5-flash";

const STYLE_VARIANT_IDS = new Set(DEFAULT_STYLE_VARIANT_PRESETS.map((p) => p.id));

export type SuggestStyleVariant = {
  id: string;
  label: string;
  priceNgn: number;
};

export type CatalogSuggestFromHero = {
  slug: string;
  name: string;
  tag: string;
  priceNgn: number;
  lead: string;
  description: string;
  fittingNotes?: string;
  fabricCareNotes?: string;
  shippingNotes?: string;
  craftFabricNotes?: string;
  craftFabricLabels?: string[];
  colourAvailabilityNotes?: string;
  garmentAudience: GarmentAudience;
  dressCategory: DressCategory;
  mannequinStyle: MannequinStyle;
  positionStyle: PositionStyle;
  background: StudioBackground;
  lighting: StudioLighting;
  cameraAngle: CameraAngle;
  galleryRestrictNoLookbook: boolean;
  heroNotes?: string;
  /** True when the studio likely sells multiple lengths/audiences with different prices. */
  multiStyleRecommended: boolean;
  /** Suggested sellable styles (ids: full-long, short, children). */
  suggestedStyleVariants?: SuggestStyleVariant[];
  /** Style ids visibly shown on the hero mannequin (for gallery ↔ price linking). */
  stylesVisibleInHero?: string[];
};

const TAG_HINTS = [
  "Ready-to-wear",
  "Made-to-order",
  "Aso-ebi / occasion wear",
  "Church wear",
  "Reception / evening",
  "Office modest",
  "Casual modest",
] as const;

function stripJsonFence(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fence?.[1]) s = fence[1].trim();
  return s;
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.round(x)));
}

function asNonEmptyString(v: unknown, fallback: string, maxLen: number): string {
  if (typeof v !== "string") return fallback;
  const t = v.trim().slice(0, maxLen);
  return t.length > 0 ? t : fallback;
}

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function normalizeTag(raw: string): string {
  const t = raw.trim();
  const lower = t.toLowerCase();
  for (const opt of TAG_HINTS) {
    if (opt.toLowerCase() === lower) return opt;
  }
  if (t.length > 0 && t.length <= 120) return t;
  return "Made-to-order";
}

function parseDressCategory(v: unknown): DressCategory {
  const s = typeof v === "string" ? v : "";
  const allowed: DressCategory[] = [
    "auto",
    "evening-gown",
    "cocktail-dress",
    "bridal-dress",
    "casual-dress",
    "maxi-dress",
    "midi-dress",
    "mini-dress",
    "kaftan",
    "aso-ebi",
  ];
  return allowed.includes(s as DressCategory) ? (s as DressCategory) : "auto";
}

function parseAudience(v: unknown): GarmentAudience {
  const s = typeof v === "string" ? v : "";
  if (s === "child" || s === "adult" || s === "unspecified") return s;
  return "adult";
}

function parseMannequin(v: unknown): MannequinStyle {
  const s = typeof v === "string" ? v : "";
  const ok = ["auto-varied", "cream-female", "headless-white", "matte-black", "wooden-dress-form"] as const;
  return ok.includes(s as MannequinStyle) ? (s as MannequinStyle) : "cream-female";
}

function parsePosition(v: unknown): PositionStyle {
  const s = typeof v === "string" ? v : "";
  const ok = ["auto-varied", "classic-straight", "soft-contrapposto", "runway-step", "arms-away", "atelier-display"] as const;
  return ok.includes(s as PositionStyle) ? (s as PositionStyle) : "classic-straight";
}

function parseBackground(v: unknown): StudioBackground {
  const s = typeof v === "string" ? v : "";
  const ok = ["soft-grey", "pure-white", "luxury-boutique", "sunlit-atelier"] as const;
  return ok.includes(s as StudioBackground) ? (s as StudioBackground) : "soft-grey";
}

function parseLighting(v: unknown): StudioLighting {
  const s = typeof v === "string" ? v : "";
  const ok = ["softbox", "editorial", "natural-daylight"] as const;
  return ok.includes(s as StudioLighting) ? (s as StudioLighting) : "softbox";
}

function parseCamera(v: unknown): CameraAngle {
  const s = typeof v === "string" ? v : "";
  return s === "three-quarter" ? "three-quarter" : "front";
}

function parseStringArray(v: unknown, max: number, maxItem: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.slice(0, maxItem))
    .slice(0, max);
  return out.length ? out : undefined;
}

function resolveStyleVariantId(rawId: unknown, rawLabel: unknown): string | null {
  const fromId = slugifyStyleVariantId(typeof rawId === "string" ? rawId : "");
  if (STYLE_VARIANT_IDS.has(fromId)) return fromId;

  const label = typeof rawLabel === "string" ? rawLabel.toLowerCase() : "";
  if (label.includes("child") || label.includes("kid") || label.includes("junior")) return "children";
  if (label.includes("short") || label.includes("mini") || label.includes("knee")) return "short";
  if (
    label.includes("long") ||
    label.includes("full") ||
    label.includes("maxi") ||
    label.includes("floor") ||
    label.includes("ankle")
  ) {
    return "full-long";
  }
  return null;
}

function parseSuggestedStyleVariants(v: unknown, fallbackPrice: number): SuggestStyleVariant[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: SuggestStyleVariant[] = [];
  const seen = new Set<string>();
  for (const row of v) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = resolveStyleVariantId(o.id, o.label);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const preset = DEFAULT_STYLE_VARIANT_PRESETS.find((p) => p.id === id);
    out.push({
      id,
      label: asNonEmptyString(o.label, preset?.label ?? id, 120),
      priceNgn: clampInt(o.priceNgn, 5000, 2_000_000, fallbackPrice),
    });
    if (out.length >= 6) break;
  }
  return out.length ? out : undefined;
}

function parseStylesVisibleInHero(v: unknown, validIds: Set<string>): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const raw of v) {
    const id = resolveStyleVariantId(raw, raw);
    if (!id || !validIds.has(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length >= 6) break;
  }
  return out.length ? out : undefined;
}

function enrichStyleSuggestions(base: CatalogSuggestFromHero): CatalogSuggestFromHero {
  let { suggestedStyleVariants, stylesVisibleInHero, multiStyleRecommended } = base;
  const { garmentAudience, priceNgn } = base;

  if (!suggestedStyleVariants?.length && garmentAudience === "child") {
    suggestedStyleVariants = [{ id: "children", label: "Children", priceNgn }];
    stylesVisibleInHero = ["children"];
    multiStyleRecommended = false;
    return { ...base, suggestedStyleVariants, stylesVisibleInHero, multiStyleRecommended };
  }

  if (suggestedStyleVariants && suggestedStyleVariants.length > 1) {
    multiStyleRecommended = true;
  }

  const validIds = new Set(suggestedStyleVariants?.map((v) => v.id) ?? []);

  if (stylesVisibleInHero?.length) {
    stylesVisibleInHero = stylesVisibleInHero.filter((id) => validIds.has(id));
    if (stylesVisibleInHero.length === 0) stylesVisibleInHero = undefined;
  }

  if (multiStyleRecommended && suggestedStyleVariants?.length && !stylesVisibleInHero?.length) {
    stylesVisibleInHero = suggestedStyleVariants.map((v) => v.id);
  }

  if (suggestedStyleVariants?.length === 1 && !stylesVisibleInHero?.length) {
    stylesVisibleInHero = [suggestedStyleVariants[0]!.id];
  }

  return { ...base, multiStyleRecommended, suggestedStyleVariants, stylesVisibleInHero };
}

function buildSuggestPrompt(): string {
  return `You are a senior catalogue copywriter for Lizzy Fusion, a modest women's fashion studio in Osogbo, Osun State, Nigeria.
The attached image is the official **Lizzy Fusion mannequin / dress-form hero** for one garment (already on-brand photography).

Infer everything a shopper and the studio need for an e-commerce product row + PDP copy. Tune all copy for:
- Nigerian women and the diaspora (UK sizing language is fine; prices in Nigerian Naira whole numbers).
- Local context: Lagos / Osun fabrics, aso-ebi and owambe culture when relevant, church/reception/office modest dressing.
- Global modest-fashion tone: elegant, precise, never sensational; respect faith-aligned modesty.

Return **only** a single JSON object (no markdown, no backticks) with exactly these keys and types:
{
  "slug": string (lowercase, hyphens, 2-80 chars, URL-safe, from garment name),
  "name": string (display title, Title Case, max 120 chars),
  "tag": string (one of: ${TAG_HINTS.map((t) => `"${t}"`).join(" | ")} — pick the closest),
  "priceNgn": number (realistic retail/guide price in NGN, integer 15000-950000),
  "lead": string (1-3 sentences: fittings in Osogbo, WhatsApp confirmation, group orders, pickup vs courier — max 500 chars),
  "description": string (2-4 short paragraphs for PDP: silhouette, occasion, modest coverage, styling — max 1800 chars),
  "fittingNotes": string or null (modest ease, UK size guidance, length tweaks — max 900 chars; null if default copy is fine),
  "fabricCareNotes": string or null (crepe, adire, lace, ankara, lining — max 900 chars),
  "shippingNotes": string or null (Nigeria nationwide courier, Osogbo pickup, WhatsApp agreements — max 900 chars),
  "craftFabricNotes": string or null (studio craft story — max 900 chars),
  "craftFabricLabels": string[] or null (2-5 short chips, e.g. "Lined bodice", "Osogbo finishing"),
  "colourAvailabilityNotes": string or null (colourways / fabric on request — max 400 chars),
  "garmentAudience": "adult" | "child" | "unspecified",
  "dressCategory": "auto" | "evening-gown" | "cocktail-dress" | "bridal-dress" | "casual-dress" | "maxi-dress" | "midi-dress" | "mini-dress" | "kaftan" | "aso-ebi",
  "mannequinStyle": "cream-female" | "headless-white" | "matte-black" | "wooden-dress-form" | "auto-varied",
  "positionStyle": "classic-straight" | "soft-contrapposto" | "runway-step" | "arms-away" | "atelier-display" | "auto-varied",
  "background": "soft-grey" | "pure-white" | "luxury-boutique" | "sunlit-atelier",
  "lighting": "softbox" | "editorial" | "natural-daylight",
  "cameraAngle": "front" | "three-quarter",
  "galleryRestrictNoLookbook": boolean (true if this PDP should use only this hero + uploaded extras, no generic filler),
  "heroNotes": string or null (short studio notes for possible future re-generation; max 300 chars),
  "multiStyleRecommended": boolean (true if this SKU likely sells multiple lengths/audiences at different prices — common for aso-ebi, mother-and-child sets, or long+short shown together),
  "suggestedStyleVariants": array or null (0-6 items; each { "id": "full-long"|"short"|"children", "label": string, "priceNgn": number } — only include styles the studio would actually sell; price each style realistically; children's lower than adult),
  "stylesVisibleInHero": string[] or null (subset of ids from suggestedStyleVariants that are **visibly shown** on the mannequin in this hero — e.g. both full-long and short if two lengths appear in one photo; only children if a child mannequin; one id if a single length is shown)
}

Style id guide:
- "full-long": floor-length / ankle / maxi on display
- "short": knee / midi / cocktail length on display
- "children": child mannequin or clearly children's sizing

Use null (not empty string) when optional text should fall back to site defaults. Be specific to what you see in the image.`;
}

/** Normalizes / validates model JSON before the admin UI applies it. Exported for tests. */
export function normalizeCatalogSuggestPayload(o: Record<string, unknown>): CatalogSuggestFromHero {
  const name = asNonEmptyString(o.name, "New catalogue piece", 200);
  const slugRaw = asNonEmptyString(o.slug, slugify(name), 100);
  const slug = slugify(slugRaw) || slugify(name) || "new-piece";
  const priceNgn = clampInt(o.priceNgn, 5000, 2_000_000, 85000);
  const suggestedStyleVariants = parseSuggestedStyleVariants(o.suggestedStyleVariants, priceNgn);
  const validStyleIds = new Set(suggestedStyleVariants?.map((v) => v.id) ?? STYLE_VARIANT_IDS);

  const base: CatalogSuggestFromHero = {
    slug,
    name,
    tag: normalizeTag(asNonEmptyString(o.tag, "Made-to-order", 120)),
    priceNgn,
    lead: asNonEmptyString(
      o.lead,
      "Confirm fabric and timeline on WhatsApp; fittings in Osogbo by appointment.",
      500,
    ),
    description: asNonEmptyString(
      o.description,
      "Modest Lizzy Fusion piece — message the studio on WhatsApp for fabric, colour, and sizing.",
      2000,
    ),
    fittingNotes: o.fittingNotes === null ? undefined : asNonEmptyString(o.fittingNotes, "", 900) || undefined,
    fabricCareNotes: o.fabricCareNotes === null ? undefined : asNonEmptyString(o.fabricCareNotes, "", 900) || undefined,
    shippingNotes: o.shippingNotes === null ? undefined : asNonEmptyString(o.shippingNotes, "", 900) || undefined,
    craftFabricNotes: o.craftFabricNotes === null ? undefined : asNonEmptyString(o.craftFabricNotes, "", 900) || undefined,
    craftFabricLabels: parseStringArray(o.craftFabricLabels, 8, 80),
    colourAvailabilityNotes:
      o.colourAvailabilityNotes === null
        ? undefined
        : asNonEmptyString(o.colourAvailabilityNotes, "", 400) || undefined,
    garmentAudience: parseAudience(o.garmentAudience),
    dressCategory: parseDressCategory(o.dressCategory),
    mannequinStyle: parseMannequin(o.mannequinStyle),
    positionStyle: parsePosition(o.positionStyle),
    background: parseBackground(o.background),
    lighting: parseLighting(o.lighting),
    cameraAngle: parseCamera(o.cameraAngle),
    galleryRestrictNoLookbook: Boolean(o.galleryRestrictNoLookbook),
    heroNotes: o.heroNotes === null ? undefined : asNonEmptyString(o.heroNotes, "", 300) || undefined,
    multiStyleRecommended: Boolean(o.multiStyleRecommended),
    suggestedStyleVariants,
    stylesVisibleInHero: parseStylesVisibleInHero(o.stylesVisibleInHero, validStyleIds),
  };

  return enrichStyleSuggestions(base);
}

/** Parses model output (including optional ```json fences) into a validated payload. */
export function parseSuggestModelText(rawText: string): CatalogSuggestFromHero {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(rawText));
  } catch {
    throw new Error("Model did not return valid JSON for product suggestions.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Model JSON was not an object.");
  }

  return normalizeCatalogSuggestPayload(parsed as Record<string, unknown>);
}

export async function generateProductSuggestionsFromHeroImage(
  imageBytes: Buffer,
  mimeType: string,
): Promise<CatalogSuggestFromHero> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (create a key in Google AI Studio and add it to the server env).");
  }

  const ai = new GoogleGenAI({ apiKey });
  const b64 = imageBytes.toString("base64");
  const prompt = buildSuggestPrompt();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [createPartFromText(prompt), createPartFromBase64(b64, mimeType)],
  });

  const rawText = response.text?.trim();
  if (!rawText) {
    throw new Error("Model returned no text for product suggestions.");
  }

  return parseSuggestModelText(rawText);
}

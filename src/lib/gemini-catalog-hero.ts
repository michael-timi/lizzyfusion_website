import { GoogleGenAI, createPartFromBase64, createPartFromText } from "@google/genai";

const MODEL = "gemini-2.5-flash-image";

export type GarmentAudience = "adult" | "child" | "unspecified";
export type DressCategory =
  | "auto"
  | "evening-gown"
  | "cocktail-dress"
  | "bridal-dress"
  | "casual-dress"
  | "maxi-dress"
  | "midi-dress"
  | "mini-dress"
  | "kaftan"
  | "aso-ebi";
export type MannequinStyle = "auto-varied" | "cream-female" | "matte-black" | "wooden-dress-form" | "headless-white";
export type StudioBackground = "soft-grey" | "pure-white" | "luxury-boutique" | "sunlit-atelier";
export type StudioLighting = "softbox" | "editorial" | "natural-daylight";
export type CameraAngle = "front" | "three-quarter";
export type PositionStyle =
  | "auto-varied"
  | "classic-straight"
  | "soft-contrapposto"
  | "runway-step"
  | "arms-away"
  | "atelier-display";

export type MannequinHeroOptions = {
  audience: GarmentAudience;
  dressCategory?: DressCategory;
  mannequinStyle?: MannequinStyle;
  background?: StudioBackground;
  lighting?: StudioLighting;
  cameraAngle?: CameraAngle;
  positionStyle?: PositionStyle;
  extraNotes?: string;
};

function pickOne<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Shared catalogue framing for gowns / maxi — hem floats above mannequin feet unless reference pools on floor. */
const FULL_LENGTH_HEM_ON_MANNEQUIN =
  "For floor-length gowns, maxi dresses, kaftans, abayas, aso-ebi, and similar full-length styles: preserve the garment's long silhouette and designed length from the reference, but the skirt hem may end at ankle level or slightly above the mannequin's feet and stand (typical boutique catalogue styling). Do not extend or pool the skirt to cover the mannequin's feet or touch the studio floor unless the reference clearly shows that.";

function describeDressCategory(category: DressCategory | undefined): string {
  switch (category) {
    case "evening-gown":
      return "Treat the garment as a women's evening gown; show the full length and elegant drape. " + FULL_LENGTH_HEM_ON_MANNEQUIN;
    case "cocktail-dress":
      return "Treat the garment as a women's cocktail dress; keep the silhouette polished and occasion-ready.";
    case "bridal-dress":
      return "Treat the garment as a women's bridal dress; preserve lace, beadwork, trains, veils, and delicate whites accurately.";
    case "casual-dress":
      return "Treat the garment as a women's casual dress; keep the presentation clean, relaxed, and realistic.";
    case "maxi-dress":
      return "Treat the garment as a women's maxi dress; preserve floor-length fall. " + FULL_LENGTH_HEM_ON_MANNEQUIN;
    case "midi-dress":
      return "Treat the garment as a women's midi dress; show the full body and natural hem placement below the knee.";
    case "mini-dress":
      return "Treat the garment as a women's mini dress; keep the hem length faithful and do not lengthen it.";
    case "kaftan":
      return "Treat the garment as a women's kaftan; preserve loose volume, sleeve width, embroidery, and modest drape. " + FULL_LENGTH_HEM_ON_MANNEQUIN;
    case "aso-ebi":
      return "Treat the garment as a women's aso-ebi or occasion dress; preserve embellishment, structured tailoring, wrapper details, and head-to-toe elegance. " + FULL_LENGTH_HEM_ON_MANNEQUIN;
    case "auto":
    default:
      return "Infer the women's dress category from the photo without changing the design.";
  }
}

function describeMannequin(style: MannequinStyle | undefined): string {
  switch (style) {
    case "auto-varied":
      return describeMannequin(pickOne(["cream-female", "matte-black", "wooden-dress-form", "headless-white"] as const));
    case "matte-black":
      return "Use a premium matte-black female boutique mannequin with smooth faceless finish.";
    case "wooden-dress-form":
      return "Use an elegant wooden female dress form with a refined couture atelier feel.";
    case "headless-white":
      return "Use a clean headless white female mannequin with realistic proportions and no human features.";
    case "cream-female":
    default:
      return "Use an elegant cream or porcelain female fashion mannequin with a smooth faceless finish.";
  }
}

function describeBackground(background: StudioBackground | undefined): string {
  switch (background) {
    case "pure-white":
      return "Use a pure white e-commerce studio background with very clean edges.";
    case "luxury-boutique":
      return "Use a tasteful luxury boutique setting with subtle depth, no distracting props, and no logos.";
    case "sunlit-atelier":
      return "Use a sunlit fashion atelier setting with soft neutral surroundings and minimal background detail.";
    case "soft-grey":
    default:
      return "Use a soft grey or warm-white seamless studio backdrop.";
  }
}

function describeLighting(lighting: StudioLighting | undefined): string {
  switch (lighting) {
    case "editorial":
      return "Use polished editorial lighting with gentle directional shadows and premium lookbook contrast.";
    case "natural-daylight":
      return "Use soft natural daylight, realistic shadows, and true-to-original colour.";
    case "softbox":
    default:
      return "Use professional softbox lighting, even exposure, gentle shadows, and true-to-original colour.";
  }
}

function describeCameraAngle(angle: CameraAngle | undefined): string {
  switch (angle) {
    case "three-quarter":
      return "Use a full-body slight three-quarter angle while keeping the garment details clearly visible.";
    case "front":
    default:
      return "Use a centred full-body front-facing view.";
  }
}

function describePositionStyle(style: PositionStyle | undefined): string {
  switch (style) {
    case "classic-straight":
      return "Position the mannequin in a classic straight catalogue stance with balanced shoulders and clear symmetry.";
    case "soft-contrapposto":
      return "Position the mannequin in a soft contrapposto fashion stance with gentle hip shift and natural garment fall.";
    case "runway-step":
      return "Position the mannequin in a subtle runway-step stance, keeping both the hem and front construction visible.";
    case "arms-away":
      return "Position the mannequin with arms slightly away from the body so sleeves, side seams, waist, and silhouette are visible.";
    case "atelier-display":
      return "Position the mannequin like an atelier display form, elegant and still, with fabric falling naturally.";
    case "auto-varied":
    default:
      return describePositionStyle(
        pickOne(["classic-straight", "soft-contrapposto", "runway-step", "arms-away", "atelier-display"] as const),
      );
  }
}

export function buildMannequinEditPrompt(opts: MannequinHeroOptions): string {
  const form =
    opts.audience === "child"
      ? "Use a child-proportioned professional dress form or boutique child mannequin."
      : opts.audience === "adult"
        ? describeMannequin(opts.mannequinStyle)
        : `${describeMannequin(opts.mannequinStyle)} Match the proportions to the garment size implied by the photo.`;
  const notes = opts.extraNotes?.trim()
    ? `\nAdditional studio direction (do not contradict faithfulness rules): ${opts.extraNotes.trim()}`
    : "";
  return `You are helping a modest fashion studio prepare a catalogue hero image.

Edit the provided photograph of a garment. ${form}
${describeDressCategory(opts.dressCategory)}

Faithfulness (critical):
- Preserve the exact garment: cut, seams, colour, print/pattern, length, sleeves, neckline, closures, pleats, embellishments, and fabric texture. Do not invent new design elements or “improve” the silhouette unless the source is clearly damaged by shadow—then correct only exposure, not shape.
- The garment on the mannequin must be recognisably the same piece a customer would receive.

Scene:
- ${describeBackground(opts.background)}
- ${describeLighting(opts.lighting)}
- ${describeCameraAngle(opts.cameraAngle)}
- ${describePositionStyle(opts.positionStyle)}
- No busy props, no logos, no text in the image.
- Full-body framing: include the mannequin from head (faceless) to feet in frame; do not crop the dress hem out of the image.
- ${FULL_LENGTH_HEM_ON_MANNEQUIN}
- Professional modest-fashion lookbook quality, realistic photography (not illustration) unless the source is already illustrated.

Output:
- Return one edited photograph as the primary result (mannequin / dress form shot).${notes}`;
}

export type GeminiHeroResult = {
  imageBase64: string;
  mimeType: string;
  model: string;
};

export async function generateMannequinHeroImage(
  imageBytes: Buffer,
  mimeType: string,
  opts: MannequinHeroOptions,
): Promise<GeminiHeroResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (create a key in Google AI Studio and add it to the server env).");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildMannequinEditPrompt(opts);
  const b64 = imageBytes.toString("base64");

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [createPartFromText(prompt), createPartFromBase64(b64, mimeType)],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const id = part.inlineData;
    if (id?.data && id.mimeType?.startsWith("image/")) {
      return { imageBase64: id.data, mimeType: id.mimeType, model: MODEL };
    }
  }

  const text = response.text?.trim();
  throw new Error(
    text
      ? `Model did not return an image. It replied: ${text.slice(0, 500)}`
      : "Model did not return an image part. Try a clearer photo or adjust notes.",
  );
}

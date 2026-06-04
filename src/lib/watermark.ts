import sharp from "sharp";

/**
 * Brand watermark applied to catalogue images served through `/api/img`.
 * Masters in Firebase Storage stay clean; the proxy stamps this wordmark at
 * request time so any image saved/screenshotted from the site carries the brand.
 */
export const WATERMARK_TEXT = "Lizzy Fusion";

/** Tunable look. Opacity is intentionally low so the product stays the hero. */
const WATERMARK_FILL = "#111111";
const WATERMARK_OPACITY = 0.16;
const WATERMARK_ROTATION_DEG = -30;
/** Longest edge we serve; bounds payload + sharp work for very large masters. */
const MAX_OUTPUT_WIDTH = 1600;
const WEBP_QUALITY = 82;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** A full-canvas SVG with the wordmark tiled diagonally via an SVG pattern. */
function buildWatermarkSvg(width: number, height: number): string {
  const text = escapeXml(WATERMARK_TEXT);
  const fontSize = Math.max(10, Math.round(Math.min(width, height) * 0.028));
  // Tile big enough to hold the rotated wordmark plus breathing room.
  const approxTextWidth = Math.round(fontSize * WATERMARK_TEXT.length * 0.62);
  const tileWidth = approxTextWidth + fontSize * 4;
  const tileHeight = fontSize * 5;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <pattern id="lf-wm" width="${tileWidth}" height="${tileHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(${WATERMARK_ROTATION_DEG})">
      <text x="0" y="${fontSize}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}" font-weight="600" letter-spacing="2" fill="${WATERMARK_FILL}" fill-opacity="${WATERMARK_OPACITY}">${text}</text>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#lf-wm)" />
</svg>`;
}

/**
 * Resize (cap to {@link MAX_OUTPUT_WIDTH} or `requestedWidth`), stamp the brand
 * wordmark, and encode as WebP. Throws if the input is not a decodable image.
 */
export async function watermarkImage(
  input: Buffer,
  requestedWidth?: number,
): Promise<Buffer> {
  const base = sharp(input).rotate();
  const meta = await base.metadata();

  const sourceWidth = meta.width ?? MAX_OUTPUT_WIDTH;
  const targetWidth = Math.min(
    requestedWidth && requestedWidth > 0 ? requestedWidth : sourceWidth,
    MAX_OUTPUT_WIDTH,
  );

  const resized = base.resize({ width: targetWidth, withoutEnlargement: true });
  const { data, info } = await resized.toBuffer({ resolveWithObject: true });

  const overlay = Buffer.from(buildWatermarkSvg(info.width, info.height));

  return sharp(data)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

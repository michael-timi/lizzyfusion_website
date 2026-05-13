/**
 * Smoke test the admin dress-to-mannequin generator end-to-end (Gemini path only).
 *
 * Reads .env.local for GEMINI_API_KEY, calls the same code the API route uses,
 * and writes generated PNGs to ./scripts/.gemini-dress-output/.
 *
 * Usage:
 *   npx tsx scripts/test-gemini-dress.mts <path-to-dress-image> [count]
 *
 * Examples:
 *   npx tsx scripts/test-gemini-dress.mts ./my-dress.jpg
 *   npx tsx scripts/test-gemini-dress.mts ./my-dress.jpg 3
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateMannequinHeroImage,
  type MannequinHeroOptions,
} from "../src/lib/gemini-catalog-hero";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

function loadEnvLocal(): void {
  const envPath = join(projectRoot, ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function mimeFromExt(p: string): string {
  const ext = extname(p).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/png";
}

async function main(): Promise<void> {
  loadEnvLocal();

  if (!process.env.GEMINI_API_KEY?.trim()) {
    console.error(
      "GEMINI_API_KEY is missing. Add it to .env.local (Google AI Studio → API keys) and retry.",
    );
    process.exit(1);
  }

  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error("Usage: npx tsx scripts/test-gemini-dress.mts <path-to-dress-image> [count]");
    process.exit(1);
  }

  const countArg = Number(process.argv[3] ?? "2");
  const count = Number.isFinite(countArg) && countArg >= 1 && countArg <= 5 ? countArg : 2;

  const inputPath = resolve(process.cwd(), inputArg);
  if (!existsSync(inputPath)) {
    console.error(`Input image not found: ${inputPath}`);
    process.exit(1);
  }

  const imageBytes = readFileSync(inputPath);
  const mimeType = mimeFromExt(inputPath);
  const outDir = join(projectRoot, "scripts", ".gemini-dress-output");
  mkdirSync(outDir, { recursive: true });

  const baseOptions: MannequinHeroOptions = {
    audience: "adult",
    dressCategory: "auto",
    mannequinStyle: "auto-varied",
    positionStyle: "auto-varied",
    background: "soft-grey",
    lighting: "softbox",
    cameraAngle: "front",
  };

  console.log(
    `Running ${count} generation(s) with auto-varied mannequin + positioning…\n  input: ${inputPath}\n  mime:  ${mimeType}\n  out:   ${outDir}`,
  );

  let failures = 0;
  for (let i = 1; i <= count; i++) {
    const started = Date.now();
    try {
      const result = await generateMannequinHeroImage(imageBytes, mimeType, baseOptions);
      const ms = Date.now() - started;
      const ext = result.mimeType === "image/jpeg" ? "jpg" : result.mimeType === "image/webp" ? "webp" : "png";
      const outFile = join(outDir, `dress-mannequin-${Date.now()}-${i}.${ext}`);
      writeFileSync(outFile, Buffer.from(result.imageBase64, "base64"));
      console.log(`  [${i}/${count}] ok in ${ms}ms — model: ${result.model} — wrote ${outFile}`);
    } catch (err) {
      failures++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [${i}/${count}] failed: ${msg}`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures}/${count} generation(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll generations succeeded.");
}

await main();

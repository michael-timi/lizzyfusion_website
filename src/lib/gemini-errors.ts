/**
 * Normalize Google Gemini / GenAI failures for HTTP responses and UI copy.
 * SDK errors often embed JSON strings with code 429 and quota details.
 */
export type GeminiFailureParsed = {
  userMessage: string;
  httpStatus: number;
  /** Seconds until retry, when we could infer them from the error text */
  retryAfterSec?: number;
};

export function parseGeminiFailure(error: unknown): GeminiFailureParsed {
  const raw = error instanceof Error ? error.message : String(error);

  const retryMatch = raw.match(/retry in ([\d.]+)\s*s/i);
  const retryAfterSec = retryMatch ? Math.max(1, Math.ceil(parseFloat(retryMatch[1]))) : undefined;

  const isQuotaOrRateLimit =
    /\b429\b/i.test(raw) ||
    /RESOURCE_EXHAUSTED/i.test(raw) ||
    /Quota exceeded|quota exceeded/i.test(raw) ||
    /generate_content_free_tier/i.test(raw) ||
    /rate.?limit/i.test(raw);

  if (isQuotaOrRateLimit) {
    const wait =
      retryAfterSec !== undefined
        ? ` You can retry in about ${retryAfterSec} seconds.`
        : " Wait a short time and try again.";
    return {
      userMessage: `Gemini API quota or rate limit reached. Catalog hero uses an image-capable model with tight limits on the free tier; billing or a paid tier may be required for steady use.${wait} Monitor usage in Google AI Studio and see https://ai.google.dev/gemini-api/docs/rate-limits`,
      httpStatus: 429,
      retryAfterSec,
    };
  }

  return {
    userMessage: raw.length > 2000 ? `${raw.slice(0, 2000)}…` : raw,
    httpStatus: 422,
  };
}

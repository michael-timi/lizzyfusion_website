import { describe, expect, it } from "vitest";
import { parseGeminiFailure } from "./gemini-errors";

describe("parseGeminiFailure", () => {
  it("maps Gemini 503 UNAVAILABLE / high demand to 503 and friendly copy", () => {
    const raw = JSON.stringify({
      error: {
        code: 503,
        message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
        status: "UNAVAILABLE",
      },
    });
    const r = parseGeminiFailure(new Error(raw));
    expect(r.httpStatus).toBe(503);
    expect(r.userMessage).toMatch(/temporarily at capacity|high demand/i);
    expect(r.retryAfterSec).toBe(60);
  });

  it("still maps 429 / quota to 429", () => {
    const r = parseGeminiFailure(new Error('{"error":{"code":429,"message":"Quota exceeded"}}'));
    expect(r.httpStatus).toBe(429);
    expect(r.userMessage).toMatch(/quota|rate limit/i);
  });

  it("defaults unknown errors to 422 with truncated message", () => {
    const r = parseGeminiFailure(new Error("Something obscure went wrong"));
    expect(r.httpStatus).toBe(422);
    expect(r.userMessage).toContain("obscure");
  });
});

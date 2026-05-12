import { describe, expect, it } from "vitest";
import { sanitizeNextParam } from "./auth-redirect";

describe("sanitizeNextParam", () => {
  it("allows internal paths", () => {
    expect(sanitizeNextParam("/checkout/info")).toBe("/checkout/info");
  });

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeNextParam("//evil.com/phish")).toBe("/");
  });

  it("rejects non-path values", () => {
    expect(sanitizeNextParam("https://evil.com")).toBe("/");
    expect(sanitizeNextParam(null)).toBe("/");
  });
});

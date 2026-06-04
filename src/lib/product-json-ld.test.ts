import { describe, expect, it } from "vitest";
import { jsonLdScriptContent } from "@/lib/product-json-ld";

describe("jsonLdScriptContent", () => {
  it("escapes characters that can break out of a script tag", () => {
    const out = jsonLdScriptContent({
      name: "</script><img src=x onerror=alert(1)>",
      brand: "Lizzy & Fusion",
    });

    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script\\u003e");
    expect(out).toContain("Lizzy \\u0026 Fusion");
  });
});

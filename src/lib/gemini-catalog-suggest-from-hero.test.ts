import { describe, expect, it } from "vitest";
import {
  normalizeCatalogSuggestPayload,
  parseSuggestModelText,
} from "./gemini-catalog-suggest-from-hero";

describe("normalizeCatalogSuggestPayload", () => {
  it("fills defaults for sparse model output", () => {
    const out = normalizeCatalogSuggestPayload({});
    expect(out.name).toBe("New catalogue piece");
    expect(out.slug).toBe("new-catalogue-piece");
    expect(out.tag).toBe("Made-to-order");
    expect(out.priceNgn).toBe(85000);
    expect(out.garmentAudience).toBe("adult");
    expect(out.dressCategory).toBe("auto");
    expect(out.mannequinStyle).toBe("cream-female");
    expect(out.positionStyle).toBe("classic-straight");
    expect(out.background).toBe("soft-grey");
    expect(out.lighting).toBe("softbox");
    expect(out.cameraAngle).toBe("front");
    expect(out.galleryRestrictNoLookbook).toBe(false);
    expect(out.multiStyleRecommended).toBe(false);
    expect(out.suggestedStyleVariants).toBeUndefined();
    expect(out.stylesVisibleInHero).toBeUndefined();
  });

  it("maps known tag hint case-insensitively", () => {
    const out = normalizeCatalogSuggestPayload({
      name: "Test",
      tag: "aso-ebi / occasion wear",
    });
    expect(out.tag).toBe("Aso-ebi / occasion wear");
  });

  it("clamps price and coerces invalid enums", () => {
    const out = normalizeCatalogSuggestPayload({
      name: "Gown",
      slug: "gown",
      priceNgn: 9_999_999,
      dressCategory: "not-a-real-category",
      mannequinStyle: "neon",
      cameraAngle: "wide",
    });
    expect(out.priceNgn).toBe(2_000_000);
    expect(out.dressCategory).toBe("auto");
    expect(out.mannequinStyle).toBe("cream-female");
    expect(out.cameraAngle).toBe("front");
  });

  it("parses multi-style suggestions and visible hero styles", () => {
    const out = normalizeCatalogSuggestPayload({
      name: "Aso-ebi set",
      multiStyleRecommended: true,
      suggestedStyleVariants: [
        { id: "full-long", label: "Full long gown", priceNgn: 120000 },
        { id: "short", label: "Short gown", priceNgn: 85000 },
      ],
      stylesVisibleInHero: ["full-long", "short"],
    });
    expect(out.multiStyleRecommended).toBe(true);
    expect(out.suggestedStyleVariants).toHaveLength(2);
    expect(out.suggestedStyleVariants?.[0]?.id).toBe("full-long");
    expect(out.stylesVisibleInHero).toEqual(["full-long", "short"]);
  });

  it("infers children style when garment audience is child", () => {
    const out = normalizeCatalogSuggestPayload({
      name: "Kids lace dress",
      garmentAudience: "child",
      priceNgn: 45000,
    });
    expect(out.suggestedStyleVariants).toEqual([
      { id: "children", label: "Children", priceNgn: 45000 },
    ]);
    expect(out.stylesVisibleInHero).toEqual(["children"]);
    expect(out.multiStyleRecommended).toBe(false);
  });

  it("maps fuzzy style labels to preset ids", () => {
    const out = normalizeCatalogSuggestPayload({
      name: "Gown",
      suggestedStyleVariants: [{ id: "x", label: "Kids party dress", priceNgn: 40000 }],
    });
    expect(out.suggestedStyleVariants?.[0]?.id).toBe("children");
  });

  it("treats null optional strings as absent", () => {
    const out = normalizeCatalogSuggestPayload({
      name: "X",
      fittingNotes: null,
      heroNotes: null,
    });
    expect(out.fittingNotes).toBeUndefined();
    expect(out.heroNotes).toBeUndefined();
  });
});

describe("parseSuggestModelText", () => {
  it("strips ```json fences and parses", () => {
    const raw = `\`\`\`json
{"name":"Adire maxi","slug":"adire-maxi","tag":"Made-to-order","priceNgn":120000,"lead":"L","description":"D"}
\`\`\``;
    const out = parseSuggestModelText(raw);
    expect(out.name).toBe("Adire maxi");
    expect(out.slug).toBe("adire-maxi");
  });

  it("throws on non-JSON", () => {
    expect(() => parseSuggestModelText("not json")).toThrow(/valid JSON/);
  });

  it("throws when root is not an object", () => {
    expect(() => parseSuggestModelText("[]")).toThrow(/not an object/);
  });
});

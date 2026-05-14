import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "./catalog";
import { hrefForKeywords, pickProductByKeywords, pickProductPairByKeywords } from "./catalog-keywords";

function makeProduct(over: Partial<CatalogProduct>): CatalogProduct {
  return {
    slug: "test-slug",
    name: "Test product",
    tag: "Test tag",
    price: 10000,
    lead: "Ships from studio.",
    description: "Test description.",
    image: "https://example.com/image.jpg",
    ...over,
  };
}

const catalog: readonly CatalogProduct[] = [
  makeProduct({ slug: "reception-gown", name: "Reception full-length gown", tag: "Made-to-order" }),
  makeProduct({ slug: "office-coord", name: "Office modest co-ord", tag: "Ready-to-wear" }),
  makeProduct({ slug: "aso-ebi", name: "Aso-ebi set", tag: "Made-to-order" }),
  makeProduct({ slug: "wrap-dress", name: "Everyday wrap dress", tag: "Ready-to-wear" }),
  makeProduct({
    slug: "church-shift",
    name: "Modest shift",
    tag: "Ready-to-wear",
    description: "Classic shift for Sunday church service.",
  }),
];

describe("pickProductByKeywords", () => {
  it("matches the first product whose name/tag/description contains any keyword", () => {
    expect(pickProductByKeywords(catalog, ["reception"])?.slug).toBe("reception-gown");
    expect(pickProductByKeywords(catalog, ["office"])?.slug).toBe("office-coord");
    expect(pickProductByKeywords(catalog, ["aso-ebi"])?.slug).toBe("aso-ebi");
  });

  it("matches description text when name/tag don't contain the keyword", () => {
    expect(pickProductByKeywords(catalog, ["church"])?.slug).toBe("church-shift");
  });

  it("is case-insensitive", () => {
    expect(pickProductByKeywords(catalog, ["RECEPTION"])?.slug).toBe("reception-gown");
  });

  it("tries keywords in order — first match wins", () => {
    expect(pickProductByKeywords(catalog, ["office", "reception"])?.slug).toBe("office-coord");
  });

  it("falls back to the first product when keywords are empty", () => {
    expect(pickProductByKeywords(catalog, [])?.slug).toBe("reception-gown");
  });

  it("returns undefined when nothing matches and keywords are non-empty", () => {
    expect(pickProductByKeywords(catalog, ["nonsense-keyword"])).toBeUndefined();
  });

  it("returns undefined when catalog is empty", () => {
    expect(pickProductByKeywords([], ["anything"])).toBeUndefined();
  });
});

describe("pickProductPairByKeywords", () => {
  it("returns two distinct products even when both keyword lists prefer the same one", () => {
    const pair = pickProductPairByKeywords(catalog, [["reception"], ["reception"]]);
    expect(pair).not.toBeNull();
    expect(pair![0].slug).toBe("reception-gown");
    expect(pair![1].slug).not.toBe("reception-gown");
  });

  it("uses the second keyword list when distinct matches exist", () => {
    const pair = pickProductPairByKeywords(catalog, [["aso-ebi"], ["office"]]);
    expect(pair![0].slug).toBe("aso-ebi");
    expect(pair![1].slug).toBe("office-coord");
  });

  it("returns null when catalog cannot produce even one product", () => {
    expect(pickProductPairByKeywords([], [["a"], ["b"]])).toBeNull();
  });
});

describe("hrefForKeywords", () => {
  it("deep-links to the PDP when a match exists", () => {
    expect(hrefForKeywords(catalog, ["reception"])).toBe("/shop/reception-gown");
  });

  it("falls back to /shop search when nothing matches", () => {
    expect(hrefForKeywords(catalog, ["unmatched-term"])).toBe("/shop?q=unmatched-term");
  });

  it("encodes spaces in the search fallback", () => {
    expect(hrefForKeywords([], ["wedding gown"])).toBe("/shop?q=wedding%20gown");
  });

  it("returns /shop when given no keywords and an empty catalog", () => {
    expect(hrefForKeywords([], [])).toBe("/shop");
  });
});

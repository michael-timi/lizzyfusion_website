import { describe, expect, it } from "vitest";
import {
  buildPdpGallery,
  catalogListingPrice,
  normalizeStyleVariants,
  priceViewForSelection,
  styleIdsForGalleryImage,
  withListingPriceFromVariants,
} from "@/lib/catalog-style-variants";
import type { CatalogProduct } from "@/lib/catalog";

const base: CatalogProduct = {
  slug: "test-gown",
  name: "Test",
  tag: "Gown",
  price: 50000,
  lead: "2 weeks",
  description: "Desc",
  image: "https://cdn.example/hero.jpg",
};

describe("normalizeStyleVariants", () => {
  it("accepts valid rows and dedupes ids", () => {
    const v = normalizeStyleVariants([
      { id: "full-long", label: "Full long gown", price: 80000 },
      { id: "short", label: "Short gown", price: 60000 },
    ]);
    expect(v).toHaveLength(2);
    expect(v?.[0]?.price).toBe(80000);
  });
});

describe("buildPdpGallery", () => {
  it("maps variant images to variant ids", () => {
    const product: CatalogProduct = {
      ...base,
      styleVariants: [
        { id: "full-long", label: "Full long", price: 80000, image: "https://cdn.example/full.jpg" },
        { id: "short", label: "Short", price: 60000, image: "https://cdn.example/short.jpg" },
      ],
    };
    const { urls, variantIdsByIndex } = buildPdpGallery(product);
    expect(urls).toContain("https://cdn.example/full.jpg");
    const fullIdx = urls.indexOf("https://cdn.example/full.jpg");
    expect(variantIdsByIndex[fullIdx]).toEqual(["full-long"]);
  });

  it("uses explicit galleryStyleLinks for combo photos", () => {
    const product: CatalogProduct = {
      ...base,
      image: "https://cdn.example/combo.jpg",
      styleVariants: [
        { id: "full-long", label: "Full long", price: 80000 },
        { id: "short", label: "Short", price: 60000 },
      ],
      galleryStyleLinks: [{ image: "https://cdn.example/combo.jpg", styleIds: ["full-long", "short"] }],
    };
    expect(styleIdsForGalleryImage(product, "https://cdn.example/combo.jpg")).toEqual(["full-long", "short"]);
    const { variantIdsByIndex, urls } = buildPdpGallery(product);
    const idx = urls.indexOf("https://cdn.example/combo.jpg");
    expect(variantIdsByIndex[idx]).toEqual(["full-long", "short"]);
  });
});

describe("catalogListingPrice", () => {
  it("uses minimum variant price on shop cards", () => {
    const product: CatalogProduct = {
      ...base,
      styleVariants: [
        { id: "full-long", label: "Full", price: 90000 },
        { id: "children", label: "Kids", price: 45000 },
      ],
    };
    expect(catalogListingPrice(product)).toBe(45000);
  });
});

describe("withListingPriceFromVariants", () => {
  it("sets base price to min and clears product compare-at", () => {
    const variants = [
      { id: "a", label: "A", price: 70000 },
      { id: "b", label: "B", price: 50000, compareAtPrice: 80000 },
    ];
    const out = withListingPriceFromVariants({ ...base, compareAtPrice: 90000 }, variants);
    expect(out.price).toBe(50000);
    expect(out.styleVariants).toEqual(variants);
    expect("compareAtPrice" in out).toBe(false);
  });
});

describe("priceViewForSelection", () => {
  it("returns variant price when selected", () => {
    const product: CatalogProduct = {
      ...base,
      styleVariants: [{ id: "short", label: "Short", price: 55000, compareAtPrice: 70000 }],
    };
    expect(priceViewForSelection(product, "short")).toEqual({ price: 55000, compareAtPrice: 70000 });
  });
});

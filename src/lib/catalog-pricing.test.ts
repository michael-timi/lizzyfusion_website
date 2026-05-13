import { describe, expect, it } from "vitest";
import { catalogWhatsappPriceLine, effectiveCompareAtPrice } from "./catalog-pricing";

describe("effectiveCompareAtPrice", () => {
  it("returns undefined when compare-at is missing or invalid", () => {
    expect(effectiveCompareAtPrice({ price: 10000 })).toBeUndefined();
    expect(effectiveCompareAtPrice({ price: 10000, compareAtPrice: undefined })).toBeUndefined();
    expect(effectiveCompareAtPrice({ price: 10000, compareAtPrice: 8000 })).toBeUndefined();
    expect(effectiveCompareAtPrice({ price: 10000, compareAtPrice: 10000 })).toBeUndefined();
    expect(effectiveCompareAtPrice({ price: 10000, compareAtPrice: Number.NaN })).toBeUndefined();
  });

  it("returns rounded compare-at when above price", () => {
    expect(effectiveCompareAtPrice({ price: 10000, compareAtPrice: 15000.2 })).toBe(15000);
  });
});

describe("catalogWhatsappPriceLine", () => {
  it("uses listed wording when there is no sale", () => {
    expect(catalogWhatsappPriceLine({ price: 50000 })).toContain("Listed price");
    expect(catalogWhatsappPriceLine({ price: 50000 })).toContain("₦");
  });

  it("includes was price when on sale", () => {
    const line = catalogWhatsappPriceLine({ price: 40000, compareAtPrice: 55000 });
    expect(line).toContain("was");
    expect(line).toMatch(/40[,\u202f\s]*000|40000/);
    expect(line).toMatch(/55[,\u202f\s]*000|55000/);
  });
});

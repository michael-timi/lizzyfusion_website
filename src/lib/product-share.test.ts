import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  productShareImageUrl,
  productShareMessage,
  productShareUrl,
  productWhatsappShareHref,
} from "@/lib/product-share";

describe("productShareUrl", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://lizzyfusion.example";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("builds absolute shop URL from slug", () => {
    expect(productShareUrl("aura-ruffled-brocade-dress")).toBe(
      "https://lizzyfusion.example/shop/aura-ruffled-brocade-dress",
    );
  });
});

describe("productShareImageUrl", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://lizzyfusion.example";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("passes through https URLs", () => {
    const u = "https://cdn.example/hero.jpg";
    expect(productShareImageUrl(u)).toBe(u);
  });

  it("resolves relative paths against site origin", () => {
    expect(productShareImageUrl("/catalog/hero.jpg")).toBe("https://lizzyfusion.example/catalog/hero.jpg");
  });
});

describe("productShareMessage", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://lizzyfusion.example";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("includes name, tag, price, and canonical URL", () => {
    const msg = productShareMessage({
      slug: "test-piece",
      name: "Test Abaya",
      tag: "Ready-to-wear",
      price: 50000,
      image: "https://cdn.example/a.jpg",
    });
    expect(msg).toContain("Test Abaya");
    expect(msg).toContain("Ready-to-wear");
    expect(msg).toContain("₦50,000");
    expect(msg).toContain("https://lizzyfusion.example/shop/test-piece");
  });
});

describe("productWhatsappShareHref", () => {
  it("returns a wa.me link with encoded text", () => {
    const href = productWhatsappShareHref({
      slug: "x",
      name: "Piece",
      tag: "RTW",
      price: 1000,
      image: "https://cdn.example/a.jpg",
    });
    expect(href).toMatch(/^https:\/\/wa\.me\//);
    expect(href).toContain(encodeURIComponent("Piece"));
  });
});

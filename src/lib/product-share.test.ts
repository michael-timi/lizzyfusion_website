import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  productEnquiryMessage,
  productOgImageUrl,
  productShareBlurb,
  productShareImageUrl,
  productShareMessage,
  productShareUrl,
  productWhatsappEnquiryHref,
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

describe("productOgImageUrl", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://lizzyfusion.example";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("points at the public OG proxy route for the slug", () => {
    expect(productOgImageUrl("aura-ruffled-brocade-dress")).toBe(
      "https://lizzyfusion.example/api/og/product/aura-ruffled-brocade-dress",
    );
  });
});

describe("productShareBlurb", () => {
  it("omits the product URL", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://lizzyfusion.example";
    const blurb = productShareBlurb({
      slug: "test-piece",
      name: "Test Abaya",
      tag: "Ready-to-wear",
      price: 50000,
      image: "https://cdn.example/a.jpg",
    });
    expect(blurb).toContain("Test Abaya");
    expect(blurb).not.toContain("/shop/test-piece");
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
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

describe("productEnquiryMessage", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://lizzyfusion.example";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("includes exactly one product URL on the last line", () => {
    const msg = productEnquiryMessage({
      slug: "test-piece",
      name: "Test Abaya",
      tag: "Ready-to-wear",
      price: 50000,
      image: "https://cdn.example/a.jpg",
    });
    const url = "https://lizzyfusion.example/shop/test-piece";
    expect(msg.split(url)).toHaveLength(2);
    expect(msg.trimEnd().endsWith(url)).toBe(true);
  });

  it("builds PDP enquiry with size and swatch", () => {
    const msg = productEnquiryMessage(
      {
        slug: "x",
        name: "Piece",
        tag: "RTW",
        price: 1000,
        image: "https://cdn.example/a.jpg",
      },
      { size: "UK 10 / M", swatchIndex: 1, styleLabel: "Emerald" },
    );
    expect(msg).toContain("Preferred size: UK 10 / M");
    expect(msg).toContain("swatch 2");
  });
});

describe("productWhatsappEnquiryHref", () => {
  it("returns wa.me with encoded enquiry text", () => {
    const href = productWhatsappEnquiryHref({
      slug: "x",
      name: "Piece",
      tag: "RTW",
      price: 1000,
      image: "https://cdn.example/a.jpg",
    });
    expect(href).toMatch(/^https:\/\/wa\.me\//);
    expect(href).toContain(encodeURIComponent("product enquiry"));
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

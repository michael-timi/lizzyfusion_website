import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "./catalog";
import {
  emptySiteFeatured,
  isSiteFeatured,
  resolveLookPair,
  resolveTileProduct,
  resolveTileProducts,
  type SiteFeatured,
} from "./site-featured";

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
  makeProduct({ slug: "reception-gown", name: "Reception full-length gown" }),
  makeProduct({ slug: "office-coord", name: "Office modest co-ord" }),
  makeProduct({ slug: "aso-ebi", name: "Aso-ebi set", description: "Aso-ebi for groups." }),
  makeProduct({ slug: "wrap-dress", name: "Everyday wrap dress" }),
  makeProduct({ slug: "church-shift", name: "Modest shift", description: "For Sunday church." }),
];

describe("isSiteFeatured", () => {
  it("accepts an empty doc", () => {
    expect(isSiteFeatured(emptySiteFeatured())).toBe(true);
  });

  it("accepts a fully-populated doc", () => {
    expect(
      isSiteFeatured({
        collectionTilePins: { "Wedding & reception": "reception-gown" },
        lookbookPins: { Sunday: ["church-shift", "wrap-dress"] },
      }),
    ).toBe(true);
  });

  it("rejects pins with non-slug values", () => {
    expect(
      isSiteFeatured({
        collectionTilePins: { "Wedding & reception": "NOT A SLUG" },
        lookbookPins: {},
      }),
    ).toBe(false);
  });

  it("rejects lookbook pins that are not exactly two slugs", () => {
    expect(
      isSiteFeatured({
        collectionTilePins: {},
        lookbookPins: { Sunday: ["only-one-slug"] },
      }),
    ).toBe(false);
    expect(
      isSiteFeatured({
        collectionTilePins: {},
        lookbookPins: { Sunday: ["a-slug", "b-slug", "c-slug"] },
      }),
    ).toBe(false);
  });

  it("rejects missing required keys", () => {
    expect(isSiteFeatured({ collectionTilePins: {} })).toBe(false);
    expect(isSiteFeatured({ lookbookPins: {} })).toBe(false);
    expect(isSiteFeatured(null)).toBe(false);
    expect(isSiteFeatured("string")).toBe(false);
  });
});

describe("resolveTileProduct", () => {
  const tile = { label: "Wedding & reception", keywords: ["reception", "bridal"] as const };

  it("uses an admin pin when it points to a live product", () => {
    const featured: SiteFeatured = {
      collectionTilePins: { "Wedding & reception": "wrap-dress" },
      lookbookPins: {},
    };
    const r = resolveTileProduct(featured, catalog, tile);
    expect(r.source).toBe("pin");
    expect(r.product?.slug).toBe("wrap-dress");
    expect(r.href).toBe("/shop/wrap-dress");
  });

  it("falls back to keyword resolution when there's no pin", () => {
    const r = resolveTileProduct(emptySiteFeatured(), catalog, tile);
    expect(r.source).toBe("keywords");
    expect(r.product?.slug).toBe("reception-gown");
    expect(r.href).toBe("/shop/reception-gown");
  });

  it("falls back to keyword resolution when the pin is orphaned (slug not in catalogue)", () => {
    const featured: SiteFeatured = {
      collectionTilePins: { "Wedding & reception": "no-longer-exists" },
      lookbookPins: {},
    };
    const r = resolveTileProduct(featured, catalog, tile);
    expect(r.source).toBe("keywords");
    expect(r.product?.slug).toBe("reception-gown");
  });

  it("returns a /shop?q=… search href when nothing matches", () => {
    const r = resolveTileProduct(emptySiteFeatured(), catalog, {
      label: "Tile",
      keywords: ["unmatched-keyword-xyz"],
    });
    expect(r.source).toBe("search-fallback");
    expect(r.product).toBeNull();
    expect(r.href).toContain("/shop?q=");
  });
});

describe("resolveTileProducts", () => {
  const emeraldCatalog: readonly CatalogProduct[] = [
    makeProduct({
      slug: "emerald-swirl",
      name: "Emerald swirl maxi dress",
      description: "Emerald occasion dress.",
    }),
    makeProduct({
      slug: "sapphire-overlay",
      name: "Sapphire overlay frock",
      description: "Sapphire occasion dress.",
    }),
    makeProduct({
      slug: "ruby-frock",
      name: "Ruby frock",
      description: "Ruby occasion dress.",
    }),
  ];

  it("resolves repeated keyword picks to distinct products when available", () => {
    const tiles = [
      { label: "Tile one", keywords: ["emerald"] as const },
      { label: "Tile two", keywords: ["emerald"] as const },
    ];

    const r = resolveTileProducts(emptySiteFeatured(), emeraldCatalog, tiles);

    expect(r.map((tile) => tile.product?.slug)).toEqual(["emerald-swirl", "sapphire-overlay"]);
    expect(r.map((tile) => tile.source)).toEqual(["keywords", "search-fallback"]);
  });

  it("keeps admin pins authoritative even when they repeat an already-used product", () => {
    const featured: SiteFeatured = {
      collectionTilePins: { "Pinned tile": "emerald-swirl" },
      lookbookPins: {},
    };
    const tiles = [
      { label: "Keyword tile", keywords: ["emerald"] as const },
      { label: "Pinned tile", keywords: ["ruby"] as const },
    ];

    const r = resolveTileProducts(featured, emeraldCatalog, tiles);

    expect(r.map((tile) => tile.product?.slug)).toEqual(["emerald-swirl", "emerald-swirl"]);
    expect(r.map((tile) => tile.source)).toEqual(["keywords", "pin"]);
  });

  it("allows repeated keyword products only after distinct products are exhausted", () => {
    const tiles = [
      { label: "Tile one", keywords: ["emerald"] as const },
      { label: "Tile two", keywords: ["emerald"] as const },
      { label: "Tile three", keywords: ["emerald"] as const },
    ];

    const r = resolveTileProducts(emptySiteFeatured(), emeraldCatalog.slice(0, 2), tiles);

    expect(r.map((tile) => tile.product?.slug)).toEqual(["emerald-swirl", "sapphire-overlay", "emerald-swirl"]);
  });
});

describe("resolveLookPair", () => {
  const look = {
    label: "Sunday",
    shopKeywords: [["church"], ["wrap"]] as readonly [readonly string[], readonly string[]],
  };

  it("uses a complete admin pin pair when both slugs are live", () => {
    const featured: SiteFeatured = {
      collectionTilePins: {},
      lookbookPins: { Sunday: ["office-coord", "aso-ebi"] },
    };
    const r = resolveLookPair(featured, catalog, look);
    expect(r.source).toBe("pin");
    expect(r.pair?.[0].slug).toBe("office-coord");
    expect(r.pair?.[1].slug).toBe("aso-ebi");
  });

  it("falls back to keyword pair when no pin is set", () => {
    const r = resolveLookPair(emptySiteFeatured(), catalog, look);
    expect(r.source).toBe("keywords");
    expect(r.pair?.[0].slug).toBe("church-shift");
    expect(r.pair?.[1].slug).toBe("wrap-dress");
  });

  it("falls back to keyword pair when one of the pinned slugs no longer exists", () => {
    const featured: SiteFeatured = {
      collectionTilePins: {},
      lookbookPins: { Sunday: ["office-coord", "no-longer-exists"] },
    };
    const r = resolveLookPair(featured, catalog, look);
    expect(r.source).toBe("keywords");
  });

  it("falls back to keyword pair when both pinned slugs are the same product", () => {
    const featured: SiteFeatured = {
      collectionTilePins: {},
      lookbookPins: { Sunday: ["wrap-dress", "wrap-dress"] },
    };
    const r = resolveLookPair(featured, catalog, look);
    expect(r.source).toBe("keywords");
  });

  it("returns null pair when catalogue is empty", () => {
    const r = resolveLookPair(emptySiteFeatured(), [], look);
    expect(r.pair).toBeNull();
  });
});

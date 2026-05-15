"use client";

import Link from "next/link";
import { CatalogPriceStack } from "@/components/shop/catalog-price-stack";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  trackFilterApply,
  trackLoadMore,
  trackSearch,
  trackSortApply,
  trackViewItemList,
} from "@/lib/analytics-events";
import { catalogDisplayPrice, type CatalogPricePick } from "@/lib/catalog-pricing";
import { productWhatsappEnquiryHref } from "@/lib/product-share";
import { site } from "@/lib/site";
import { ProductFilters, type SortKey } from "./product-filters";
import { ProductShareButton } from "./product-share-button";
import { WishlistHeart } from "./wishlist-heart";

type Product = CatalogPricePick & {
  slug: string;
  name: string;
  tag: string;
  lead: string;
  image: string;
};

type ShopCatalogProps = {
  query: string;
  products: readonly Product[];
};

const INITIAL_VISIBLE = 4;
const LOAD_MORE_STEP = 4;

function badgeForIndex(index: number): "New" | "Restock" | null {
  if (index === 0 || index === 1 || index === 4) return "New";
  if (index === 2 || index === 5) return "Restock";
  return null;
}

function ShopProductGrid({ products }: { products: Product[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const visibleProducts = products.slice(0, Math.min(visibleCount, products.length));
  const hasMore = visibleCount < products.length;

  return (
    <>
      <ul className="grid gap-8 sm:grid-cols-2">
        {visibleProducts.map((p) => {
          const indexInFiltered = products.findIndex((x) => x.slug === p.slug);
          const msg = productWhatsappEnquiryHref(p);
          const badge = badgeForIndex(indexInFiltered);
          return (
            <li key={p.slug} className="group/card border border-[var(--lf-line)] bg-white shadow-sm">
              <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                <Link
                  href={`/shop/${p.slug}`}
                  className="relative block h-full w-full"
                  aria-label={`View ${p.name}`}
                >
                  <LfRemoteImage
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover transition duration-500 group-hover/card:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </Link>
                {badge ? (
                  <span className="pointer-events-none absolute left-3 top-3 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--lf-ink)]">
                    {badge}
                  </span>
                ) : null}
                <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                  <WishlistHeart slug={p.slug} />
                  <ProductShareButton product={p} />
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/shop/${p.slug}`} className="group/title block">
                      <p className="font-semibold text-[var(--lf-ink)] transition group-hover/title:text-[var(--lf-purple-deep)]">
                        {p.name}
                      </p>
                    </Link>
                    <p className="mt-0.5 text-sm text-[var(--lf-muted)]">{p.tag}</p>
                  </div>
                  <CatalogPriceStack product={p} />
                </div>
                <div className="mt-3 flex gap-1.5">
                  {["#2d2d2d", "#8b7355", "#c4a574"].map((hex) => (
                    <span
                      key={hex}
                      className="h-4 w-4 rounded-full border border-zinc-200"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 border-t border-[var(--lf-line)] pt-4">
                  <a
                    href={msg}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full border border-[var(--lf-ink)] bg-[var(--lf-ink)] py-2.5 text-center text-xs font-semibold text-white transition hover:bg-[var(--lf-purple-deep)]"
                  >
                    Enquire on WhatsApp
                  </a>
                  <Link
                    href="/custom"
                    className="w-full border border-[var(--lf-line)] py-2.5 text-center text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)]"
                  >
                    Custom version
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => {
              const next = Math.min(visibleCount + LOAD_MORE_STEP, products.length);
              setVisibleCount(next);
              void trackLoadMore("shop_grid", next);
            }}
            className="min-w-[12rem] border border-[var(--lf-line)] bg-white px-10 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lf-ink)] transition hover:border-[var(--lf-ink)]"
          >
            Load more
          </button>
        </div>
      ) : null}
    </>
  );
}

export function ShopCatalog({ query, products }: ShopCatalogProps) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());

  const collectionOptions = useMemo(() => {
    const set = new Set<string>(site.specialties);
    for (const p of products) {
      if (p.tag.trim()) set.add(p.tag.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedCollections.size > 0) {
      list = list.filter((p) => selectedCollections.has(p.tag));
    }
    list.sort((a, b) => {
      if (sort === "price-asc") return catalogDisplayPrice(a) - catalogDisplayPrice(b);
      if (sort === "price-desc") return catalogDisplayPrice(b) - catalogDisplayPrice(a);
      return 0;
    });
    return list;
  }, [products, selectedCollections, sort]);

  const filteredKey = useMemo(() => filtered.map((p) => p.slug).join(","), [filtered]);

  const lastSearch = useRef<string | null>(null);
  useEffect(() => {
    const q = query.trim();
    if (!q || lastSearch.current === q) return;
    lastSearch.current = q;
    void trackSearch(q, products.length);
  }, [query, products.length]);

  const lastListKey = useRef<string | null>(null);
  useEffect(() => {
    const key = `${query}|${filteredKey}|${sort}`;
    if (lastListKey.current === key) return;
    lastListKey.current = key;
    void trackViewItemList(query.trim() ? `shop_search` : "shop_all", filtered.map((p) => ({
      item_id: p.slug,
      item_name: p.name,
      price: catalogDisplayPrice(p),
      item_category: p.tag,
    })), query.trim() ? { search_term: query.trim() } : undefined);
  }, [query, filteredKey, sort, filtered]);

  function toggleCollection(label: string) {
    setSelectedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      void trackFilterApply("shop", label);
      return next;
    });
  }

  function clearAll() {
    setSelectedCollections(new Set());
    void trackFilterApply("shop", "clear_all");
  }

  function handleSortChange(next: SortKey) {
    setSort(next);
    void trackSortApply("shop", next);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-14 pt-8 sm:px-6 lg:pb-16 lg:pt-10">
      <div className="mb-8 flex flex-col gap-2 border-b border-[var(--lf-line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {query ? (
            <p className="text-sm text-[var(--lf-muted)]">
              Results for <span className="font-semibold text-[var(--lf-ink)]">“{query}”</span>
            </p>
          ) : null}
          <p className="mt-1 font-serif text-xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-2xl">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </p>
        </div>
        <p className="max-w-md text-xs text-[var(--lf-muted)] sm:text-right">
          Prices in naira. Use filters to narrow by collection—sizes and lead times are confirmed on WhatsApp.
        </p>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
        <ProductFilters
          sort={sort}
          onSortChange={handleSortChange}
          selectedCollections={selectedCollections}
          onToggleCollection={toggleCollection}
          onClearAll={clearAll}
          collectionOptions={collectionOptions}
        />

        <div className="min-w-0 flex-1">
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--lf-line)] bg-zinc-50 px-6 py-12 text-center text-sm text-[var(--lf-muted)]">
              No pieces match these filters.{" "}
              <button type="button" onClick={clearAll} className="font-semibold text-[var(--lf-purple)] underline">
                Clear filters
              </button>{" "}
              or adjust your search.
            </p>
          ) : (
            <ShopProductGrid key={filteredKey} products={filtered} />
          )}
        </div>
      </div>
    </div>
  );
}

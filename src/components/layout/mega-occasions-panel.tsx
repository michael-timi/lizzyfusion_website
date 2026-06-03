"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CatalogPriceStack } from "@/components/shop/catalog-price-stack";
import { WishlistHeart } from "@/components/shop/wishlist-heart";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import type { CatalogProduct } from "@/lib/catalog";
import { hrefForKeywords } from "@/lib/catalog-keywords";
import { pickDistinctProducts } from "@/components/layout/use-mega-catalog";
import { landingMedia, site } from "@/lib/site";

const filterBar =
  "flex w-full items-center justify-between bg-[var(--lf-purple-deep)] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]";

/**
 * Keyword preferences for the four occasion "edit" cards. Resolved against the live catalogue at
 * mount time so retired or renamed products don't leave dead cards in the mega-nav.
 */
const occasionKeywordSets: ReadonlyArray<{
  keywords: readonly string[];
  badge?: "New" | "Restock";
}> = [
  { keywords: ["reception", "gown"], badge: "New" },
  { keywords: ["aso-ebi"] },
  { keywords: ["abaya", "ready-to-wear"], badge: "Restock" },
  { keywords: ["office"] },
];

function OccasionAccordion({
  id,
  title,
  openId,
  setOpenId,
  children,
}: {
  id: string;
  title: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  children: ReactNode;
}) {
  const open = openId === id;
  return (
    <div>
      <button type="button" onClick={() => setOpenId(open ? null : id)} className={filterBar} aria-expanded={open}>
        {title}
        <span className="text-lg font-light leading-none">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="border border-t-0 border-[var(--lf-line)] bg-white px-4 py-3">{children}</div> : null}
    </div>
  );
}

function MiniProductCard({ p, badge }: { p: CatalogProduct; badge?: "New" | "Restock" }) {
  return (
    <li className="group/card min-w-0 border border-[var(--lf-line)] bg-white shadow-sm">
      <Link href={`/shop/${p.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
          <LfRemoteImage
            src={p.image}
            alt={p.name}
            fill
            className="object-cover transition duration-500 group-hover/card:scale-105"
            sizes="(max-width: 1024px) 45vw, 200px"
          />
          {badge ? (
            <span className="pointer-events-none absolute left-2 top-2 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--lf-ink)]">
              {badge}
            </span>
          ) : null}
          <WishlistHeart slug={p.slug} className="absolute right-2 top-2 z-10" />
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-sm font-semibold text-[var(--lf-ink)] line-clamp-2">{p.name}</p>
            <CatalogPriceStack product={p} />
          </div>
          <p className="mt-1 text-xs text-[var(--lf-muted)]">{p.tag}</p>
          <div className="mt-2 flex gap-1">
            {["#2d2d2d", "#8b7355", "#c4a574"].map((hex) => (
              <span key={hex} className="h-3.5 w-3.5 rounded-full border border-zinc-200" style={{ backgroundColor: hex }} />
            ))}
          </div>
        </div>
      </Link>
    </li>
  );
}

export function MegaOccasionsPanel() {
  const [openId, setOpenId] = useState<string | null>("occasion");
  const [a, b] = landingMedia.collectionTiles;
  const [catalog, setCatalog] = useState<readonly CatalogProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { products?: CatalogProduct[] } | null) => {
        if (cancelled || !body?.products || !Array.isArray(body.products)) return;
        setCatalog(body.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const aHref = catalog ? hrefForKeywords(catalog, a.keywords) : "/shop";
  const bHref = catalog ? hrefForKeywords(catalog, b.keywords) : "/shop";

  // Resolve the two hero tiles and the four occasion cards in one distinct pass so no dress repeats
  // anywhere in the panel.
  const picks = pickDistinctProducts(catalog, [
    a.keywords,
    b.keywords,
    ...occasionKeywordSets.map((o) => o.keywords),
  ]);
  const aImage = picks[0]?.image ?? a.image;
  const bImage = picks[1]?.image ?? b.image;

  const products = catalog
    ? occasionKeywordSets
        .map(({ badge }, i) => {
          const p = picks[2 + i];
          return p ? { p, badge } : null;
        })
        .filter((x): x is { p: CatalogProduct; badge: "New" | "Restock" | undefined } => x !== null)
    : [];

  return (
    <div className="space-y-8">
      <nav className="text-sm text-[var(--lf-muted)]" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-[var(--lf-ink)]">
          Home
        </Link>
        <span className="mx-2 text-zinc-300" aria-hidden>
          /
        </span>
        <span className="font-medium text-[var(--lf-ink)]">Occasions</span>
      </nav>

      <div className="grid grid-cols-2 gap-0 border border-[var(--lf-line)] bg-zinc-100">
        <Link href={aHref} className="group/oh relative aspect-[3/4] max-h-[min(22rem,42vh)] min-h-[12rem]">
          <LfRemoteImage src={aImage} alt={a.label} fill className="object-cover transition duration-500 group-hover/oh:scale-[1.02]" sizes="50vw" />
        </Link>
        <Link href={bHref} className="group/oh relative aspect-[3/4] max-h-[min(22rem,42vh)] min-h-[12rem]">
          <LfRemoteImage src={bImage} alt={b.label} fill className="object-cover transition duration-500 group-hover/oh:scale-[1.02]" sizes="50vw" />
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,15rem)_1fr] lg:gap-12">
        <aside className="min-w-0 space-y-2">
          <h2 className="font-serif text-xl font-semibold text-[var(--lf-ink)] sm:text-2xl">Filters</h2>
          <p className="mt-1 text-xs text-[var(--lf-muted)]">Shortlist pieces for your event—confirm fabric and fittings on WhatsApp.</p>

          <div className="mt-6 space-y-2">
            <OccasionAccordion id="sort" title="Sort by" openId={openId} setOpenId={setOpenId}>
              {(["Featured", "Price · low to high", "Price · high to low"] as const).map((label) => (
                <label key={label} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                  <input type="radio" name="occ-sort" defaultChecked={label === "Featured"} className="accent-[var(--lf-purple-deep)]" />
                  {label}
                </label>
              ))}
            </OccasionAccordion>

            <OccasionAccordion id="occasion" title="Occasion" openId={openId} setOpenId={setOpenId}>
              <ul className="space-y-1 text-sm">
                {["Wedding & reception", "Aso-ebi coordination", "Church & civil", "Office & boardroom"].map((label) => (
                  <li key={label}>
                    <Link href="/custom" className="text-[var(--lf-ink)] underline-offset-2 hover:text-[var(--lf-purple)] hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </OccasionAccordion>

            <OccasionAccordion id="fabric" title="Fabric" openId={openId} setOpenId={setOpenId}>
              {(["Crepe", "Chiffon", "Cotton", "Linen"] as const).map((f) => (
                <label key={f} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                  <input type="checkbox" className="accent-[var(--lf-purple-deep)]" />
                  {f}
                </label>
              ))}
            </OccasionAccordion>
          </div>

          <Link
            href="/custom"
            className="mt-6 inline-flex w-full items-center justify-center border border-[var(--lf-purple-deep)] bg-[var(--lf-purple-deep)] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--lf-purple)]"
          >
            Start a custom request
          </Link>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--lf-line)] pb-4">
            <p className="font-serif text-xl font-semibold text-[var(--lf-ink)] sm:text-2xl">Occasion edit</p>
            <p className="text-sm text-[var(--lf-muted)]">
              {catalog === null ? "Loading…" : `${products.length} items`}
            </p>
          </div>
          {catalog === null ? (
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="aspect-[3/4] animate-pulse border border-[var(--lf-line)] bg-zinc-100 shadow-sm"
                />
              ))}
            </ul>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5">
              {products.map(({ p, badge }) => (
                <MiniProductCard key={p.slug} p={p} badge={badge} />
              ))}
            </ul>
          )}
          <p className="mt-6 text-xs text-[var(--lf-muted)]">
            Bespoke timelines in {site.location.city}—{site.name} replies on WhatsApp with next steps after you share
            your date and references.
          </p>
        </div>
      </div>
    </div>
  );
}

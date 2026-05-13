"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CatalogPriceStack } from "@/components/shop/catalog-price-stack";
import { WishlistHeart } from "@/components/shop/wishlist-heart";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { getSampleProductBySlug, landingMedia, site } from "@/lib/site";

/** Modimal-style olive for Occasions mega only (Image 1 reference). */
const oliveBar =
  "flex w-full items-center justify-between bg-[#74866a] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-[#65755f]";

const occasionSlugs = [
  "reception-full-length",
  "aso-ebi-set",
  "signature-abaya-rtw",
  "office-modest-set",
] as const;

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
      <button type="button" onClick={() => setOpenId(open ? null : id)} className={oliveBar} aria-expanded={open}>
        {title}
        <span className="text-lg font-light leading-none">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="border border-t-0 border-[var(--lf-line)] bg-white px-4 py-3">{children}</div> : null}
    </div>
  );
}

function MiniProductCard({ slug, badge }: { slug: string; badge?: "New" | "Restock" }) {
  const p = getSampleProductBySlug(slug);
  if (!p) return null;
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

  const products = occasionSlugs.map((slug, i) => ({
    slug,
    badge: (i === 0 ? "New" : i === 2 ? "Restock" : undefined) as "New" | "Restock" | undefined,
  }));

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
        <Link href={a.href} className="group/oh relative aspect-[3/4] max-h-[min(22rem,42vh)] min-h-[12rem]">
          <LfRemoteImage src={a.image} alt={a.label} fill className="object-cover transition duration-500 group-hover/oh:scale-[1.02]" sizes="50vw" />
        </Link>
        <Link href={b.href} className="group/oh relative aspect-[3/4] max-h-[min(22rem,42vh)] min-h-[12rem]">
          <LfRemoteImage src={b.image} alt={b.label} fill className="object-cover transition duration-500 group-hover/oh:scale-[1.02]" sizes="50vw" />
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
                  <input type="radio" name="occ-sort" defaultChecked={label === "Featured"} className="accent-[#74866a]" />
                  {label}
                </label>
              ))}
            </OccasionAccordion>

            <OccasionAccordion id="occasion" title="Occasion" openId={openId} setOpenId={setOpenId}>
              <ul className="space-y-1 text-sm">
                {["Wedding & reception", "Aso-ebi coordination", "Church & civil", "Office & boardroom"].map((label) => (
                  <li key={label}>
                    <Link href="/custom" className="text-[var(--lf-ink)] underline-offset-2 hover:text-[#74866a] hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </OccasionAccordion>

            <OccasionAccordion id="fabric" title="Fabric" openId={openId} setOpenId={setOpenId}>
              {(["Crepe", "Chiffon", "Cotton", "Linen"] as const).map((f) => (
                <label key={f} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                  <input type="checkbox" className="accent-[#74866a]" />
                  {f}
                </label>
              ))}
            </OccasionAccordion>
          </div>

          <Link
            href="/custom"
            className="mt-6 inline-flex w-full items-center justify-center border border-[#74866a] bg-[#74866a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#65755f]"
          >
            Start a custom request
          </Link>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--lf-line)] pb-4">
            <p className="font-serif text-xl font-semibold text-[var(--lf-ink)] sm:text-2xl">Occasion edit</p>
            <p className="text-sm text-[var(--lf-muted)]">{products.length} items</p>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5">
            {products.map(({ slug, badge }) => (
              <MiniProductCard key={slug} slug={slug} badge={badge} />
            ))}
          </ul>
          <p className="mt-6 text-xs text-[var(--lf-muted)]">
            Bespoke timelines in {site.location.city}—{site.name} replies on WhatsApp with next steps after you share
            your date and references.
          </p>
        </div>
      </div>
    </div>
  );
}

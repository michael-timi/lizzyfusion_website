"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { CatalogPriceStack } from "@/components/shop/catalog-price-stack";
import { WishlistHeart } from "@/components/shop/wishlist-heart";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { trackSelectContent } from "@/lib/analytics-events";
import type { CatalogProduct } from "@/lib/catalog";
import { site } from "@/lib/site";

const SWATCHES = ["#2d2d2d", "#8b7355", "#c4a574"] as const;

/**
 * Per-day look with its "shop the look" pair resolved server-side. The lookbook page reads the
 * live catalogue from Firestore and resolves keyword preferences before handing the data off to
 * this client component — so admin edits show up on /lookbook without any rebuild.
 */
export type ResolvedLook = {
  label: string;
  caption: string;
  href: string;
  image: string;
  heroImage: string;
  badgeNewOnIndex?: number;
  pair: readonly [CatalogProduct, CatalogProduct] | null;
};

function indexForDayParam(looks: readonly ResolvedLook[], day: string | null): number {
  if (!day || !day.trim()) {
    const sat = looks.findIndex((l) => l.label === "Saturday");
    return sat >= 0 ? sat : looks.length - 1;
  }
  const i = looks.findIndex((l) => l.label.toLowerCase() === day.trim().toLowerCase());
  return i >= 0 ? i : indexForDayParam(looks, null);
}

export function LookbookScreen({ looks }: { looks: readonly ResolvedLook[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const active = useMemo(
    () => indexForDayParam(looks, searchParams.get("day")),
    [looks, searchParams],
  );

  const look = looks[active]!;
  const pair = look.pair;

  const selectDay = (i: number) => {
    void trackSelectContent("lookbook_day", looks[i]!.label);
    router.replace(`/lookbook?day=${encodeURIComponent(looks[i]!.label)}`, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-12">
      <nav className="text-sm text-[var(--lf-muted)]" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-[var(--lf-ink)]">
          Home
        </Link>
        <span className="mx-2 text-zinc-300" aria-hidden>
          /
        </span>
        <span className="font-medium text-[var(--lf-ink)]">Lookbook</span>
      </nav>

      <header className="mt-8">
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-5xl md:text-6xl">
          {look.label}
        </h1>
        <p className="mt-2 text-sm text-[var(--lf-muted)] sm:text-base">{look.caption}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
        <div className="relative mx-auto aspect-[3/5] w-full max-w-md overflow-hidden bg-zinc-100 lg:mx-0 lg:max-w-none">
          <LfRemoteImage
            key={look.heroImage}
            src={look.heroImage}
            alt={`${look.label} — ${look.caption}`}
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {pair ? (
            <WishlistHeart slug={pair[0].slug} className="absolute right-3 top-3 z-10" />
          ) : null}
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[var(--lf-ink)] sm:text-xl">Shop the look</h2>
          <p className="mt-1 text-sm text-[var(--lf-muted)]">{pair ? 2 : 0} items</p>

          {pair ? (
            <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-6">
              {pair.map((p, i) => (
                <li key={p.slug}>
                  <Link href={`/shop/${p.slug}`} className="group/st block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                      <LfRemoteImage
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover transition duration-500 group-hover/st:scale-[1.03]"
                        sizes="(max-width: 640px) 45vw, 240px"
                      />
                      {look.badgeNewOnIndex === i ? (
                        <span className="pointer-events-none absolute left-2 top-2 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--lf-ink)]">
                          New
                        </span>
                      ) : null}
                      <WishlistHeart slug={p.slug} className="absolute right-2 top-2 z-10" />
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-[11px] font-semibold uppercase leading-snug tracking-wide text-[var(--lf-ink)] line-clamp-2">
                          {p.name.toUpperCase()}
                        </p>
                        <CatalogPriceStack product={p} />
                      </div>
                      <p className="text-xs text-[var(--lf-muted)]">{p.tag}</p>
                      <div className="flex gap-1 pt-1">
                        {SWATCHES.map((hex) => (
                          <span
                            key={`${p.slug}-${hex}`}
                            className="h-3.5 w-3.5 rounded-full border border-zinc-200"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-[var(--lf-muted)]">Pieces for this look are loading.</p>
          )}
        </div>
      </div>

      <section className="mt-16 border-t border-[var(--lf-line)] pt-12" aria-label="Week at a glance">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lf-muted)]">Week at a glance</p>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
          {looks.map((d, i) => (
            <button
              key={d.label}
              type="button"
              onClick={() => selectDay(i)}
              className={`snap-start shrink-0 text-left transition ${
                i === active ? "opacity-100" : "opacity-80 hover:opacity-100"
              }`}
              aria-current={i === active ? "true" : undefined}
              aria-label={`View ${d.label} look`}
            >
              <div
                className={`relative h-44 w-28 overflow-hidden bg-zinc-100 sm:h-52 sm:w-32 ${
                  i === active ? "ring-2 ring-[var(--lf-ink)] ring-offset-2 ring-offset-white" : ""
                }`}
              >
                <LfRemoteImage
                  src={d.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="128px"
                />
                {d.pair ? (
                  <WishlistHeart slug={d.pair[0].slug} className="absolute right-2 top-2 z-10" />
                ) : null}
              </div>
              <p
                className={`mt-2 max-w-[7rem] text-sm font-semibold sm:max-w-[8rem] ${
                  i === active ? "text-[var(--lf-ink)]" : "text-[var(--lf-muted)]"
                }`}
              >
                {d.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      <p className="mt-12 max-w-xl text-xs text-[var(--lf-muted)]">
        Looks are styled with {site.name} catalogue pieces—tap a day to refresh the hero and shop pairing. Prices in
        naira; confirm fabric and lead time on WhatsApp from each product page.
      </p>
    </div>
  );
}

export function LookbookScreenFallback() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-4 py-12 sm:px-6">
      <div className="h-4 w-40 rounded bg-zinc-200" />
      <div className="mt-8 h-12 w-48 rounded bg-zinc-200" />
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="aspect-[3/5] max-w-md rounded bg-zinc-200 lg:max-w-none" />
        <div className="space-y-4">
          <div className="h-6 w-32 rounded bg-zinc-200" />
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] rounded bg-zinc-200" />
            <div className="aspect-[3/4] rounded bg-zinc-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

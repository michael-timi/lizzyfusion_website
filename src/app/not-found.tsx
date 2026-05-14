import type { Metadata } from "next";
import Link from "next/link";
import { CatalogPriceStack } from "@/components/shop/catalog-price-stack";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { getMergedCatalog } from "@/lib/catalog";
import { landingMedia, site, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  description: `The page you were looking for isn't here. Browse ${site.name} pieces, search the boutique, or reach the studio on WhatsApp.`,
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const all = await getMergedCatalog().catch(() => []);
  const popular = all.slice(0, 3);

  const wa = whatsappHref(
    `Hello ${site.name}, I tried to open a page on your site that didn't load. Can you point me in the right direction?`,
  );

  return (
    <main className="bg-white">
      <section className="relative isolate min-h-[min(80vh,40rem)] w-full overflow-hidden">
        <LfRemoteImage
          src={landingMedia.hero}
          alt=""
          fill
          priority
          className="object-cover object-[center_20%]"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25"
        />
        <div className="relative z-10 mx-auto flex min-h-[min(80vh,40rem)] max-w-[1400px] flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:pb-24">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/85">404</p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
            This page slipped off the rail.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
            The link may have moved, the piece may be retired, or the URL may have a typo. Search the boutique, keep
            browsing below, or message the studio in {site.location.city}.
          </p>
          <form
            action="/shop"
            method="get"
            role="search"
            aria-label="Search the boutique"
            className="mt-8 flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:items-stretch"
          >
            <label htmlFor="nf-search" className="sr-only">
              Search the boutique
            </label>
            <input
              id="nf-search"
              name="q"
              type="search"
              placeholder="Try “abaya”, “reception”, or a colour…"
              className="w-full flex-1 rounded-full border border-white/40 bg-white/95 px-5 py-3 text-sm text-[var(--lf-ink)] outline-none transition placeholder:text-zinc-500 focus:border-white focus:bg-white focus:ring-2 focus:ring-white/40"
              autoComplete="off"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:bg-[var(--lf-purple)] hover:text-white"
            >
              Search shop
            </button>
          </form>
        </div>
      </section>

      {popular.length > 0 ? (
        <section className="border-b border-[var(--lf-line)] bg-white">
          <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lf-purple)]">
                  Continue browsing
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-3xl">
                  Pieces you might be after
                </h2>
              </div>
              <Link
                href="/shop"
                className="text-sm font-semibold text-[var(--lf-ink)] underline-offset-4 hover:text-[var(--lf-purple)] hover:underline"
              >
                View all →
              </Link>
            </div>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((p) => (
                <li key={p.slug} className="group/card bg-white">
                  <Link href={`/shop/${p.slug}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                      <LfRemoteImage
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover transition duration-500 group-hover/card:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="px-1 pb-1 pt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-[var(--lf-muted)]">{p.tag}</p>
                      <p className="mt-1 font-medium text-[var(--lf-ink)]">{p.name}</p>
                      <CatalogPriceStack product={p} align="start" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="bg-[var(--lf-purple-faint)]/50">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <p className="section-title">Still stuck?</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-3xl">
            Talk to the studio
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--lf-muted)]">
            Tell us the piece, occasion, or page you were looking for and we&apos;ll point you to the right place — usually
            within the hour during {site.location.city} working hours.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[var(--lf-purple-deep)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
            >
              WhatsApp the studio
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-[var(--lf-ink)] bg-white px-6 py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple)]"
            >
              Send a message
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--lf-muted)]">
            <Link href="/" className="font-medium hover:text-[var(--lf-ink)]">
              Home
            </Link>
            <Link href="/shop" className="font-medium hover:text-[var(--lf-ink)]">
              Shop
            </Link>
            <Link href="/lookbook" className="font-medium hover:text-[var(--lf-ink)]">
              Lookbook
            </Link>
            <Link href="/blog" className="font-medium hover:text-[var(--lf-ink)]">
              Journal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

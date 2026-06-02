import Image from "next/image";
import Link from "next/link";
import { CatalogPriceStack } from "@/components/shop/catalog-price-stack";
import { WishlistHeart } from "@/components/shop/wishlist-heart";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { getMergedCatalog } from "@/lib/catalog";
import { resolveTileProduct } from "@/lib/site-featured";
import { getSiteFeatured } from "@/lib/site-featured-server";
import { landingMedia, site, whatsappHref } from "@/lib/site";

const HOME_BEST_SELLERS_LIMIT = 6;

export default async function HomePage() {
  const wa = whatsappHref(
    `Hello ${site.name}, I am on your website and would love to book a consultation in ${site.location.city}.`,
  );

  const [catalog, featured] = await Promise.all([getMergedCatalog(), getSiteFeatured()]);
  const bestSellers = catalog.slice(0, HOME_BEST_SELLERS_LIMIT);

  const tilesWithHref = landingMedia.collectionTiles.map((tile) => ({
    tile,
    href: resolveTileProduct(featured, catalog, tile).href,
  }));
  const [tile0, tile1, tile2, tile3] = tilesWithHref;

  return (
    <div className="bg-white">
      {/* Hero — founder-led split: typography on the left, portrait + atelier collage on the right. */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--lf-purple-faint)] via-white to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[var(--lf-purple)]/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-[var(--lf-purple)]/10 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:pb-24 lg:pt-20">
          {/* Copy */}
          <div className="flex flex-col justify-center">
            <p className="section-title flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--lf-purple-deep)]" aria-hidden />
              {landingMedia.founder.role}
            </p>
            <h1 className="mt-6 font-serif text-4xl font-medium leading-[1.05] tracking-tight text-[var(--lf-ink)] sm:text-5xl md:text-6xl">
              Designed by {landingMedia.founder.name}.
              <span className="mt-3 block text-2xl font-normal text-[var(--lf-purple-deep)] sm:text-3xl md:text-4xl">
                {site.slogan}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-[var(--lf-muted)] sm:text-base">
              Modest pieces cut, fitted, and finished by hand in {site.location.city},{" "}
              {site.location.state}. Bespoke, ready-to-wear, and custom design—prices in naira,
              with WhatsApp guidance from the studio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-sharp">
                Shop collections
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center border border-[var(--lf-ink)] px-8 py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:bg-[var(--lf-ink)] hover:text-white"
              >
                WhatsApp studio
              </a>
            </div>
            <p className="mt-8 max-w-md text-xs uppercase tracking-[0.18em] text-[var(--lf-muted)]">
              Meet {landingMedia.founder.name} — the hands behind every piece.
            </p>
          </div>

          {/* Founder collage */}
          <div className="space-y-3 sm:space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 shadow-sm ring-1 ring-black/5">
              <Image
                src={landingMedia.founder.portrait.src}
                alt={landingMedia.founder.portrait.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover object-top"
              />
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 bg-white/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lf-ink)] shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--lf-purple-deep)]" aria-hidden />
                {landingMedia.founder.name} · founder
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100 shadow-sm ring-1 ring-black/5">
                <Image
                  src={landingMedia.founder.studio.src}
                  alt={landingMedia.founder.studio.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 22vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100 shadow-sm ring-1 ring-black/5">
                <Image
                  src={landingMedia.founder.atelier.src}
                  alt={landingMedia.founder.atelier.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 22vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section id="best-sellers" className="lf-section-muted scroll-mt-28 border-b border-[var(--lf-line)]">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">
              Best sellers
            </h2>
            <Link
              href="/shop"
              className="text-sm font-semibold text-[var(--lf-ink)] underline-offset-4 hover:text-[var(--lf-purple)] hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bestSellers.map((p) => {
              return (
                <li key={p.slug} className="group/card bg-white">
                  <div className="relative">
                    <Link href={`/shop/${p.slug}`} className="block">
                      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-200">
                        <LfRemoteImage
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover transition duration-500 group-hover/card:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                      <div className="px-4 pb-5 pt-4 sm:px-5 sm:pb-6">
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--lf-muted)]">
                          {p.tag}
                        </p>
                        <p className="mt-1 font-medium text-[var(--lf-ink)]">{p.name}</p>
                        <CatalogPriceStack product={p} align="start" />
                      </div>
                    </Link>
                    <WishlistHeart slug={p.slug} className="absolute right-3 top-3" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Collection bento */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">
          Collection
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3 lg:gap-4 lg:min-h-[560px]">
          <CollectionTile {...tile0} className="min-h-[240px] sm:min-h-[280px] lg:col-span-2 lg:row-span-2 lg:min-h-0" />
          <CollectionTile {...tile1} className="min-h-[220px] lg:col-span-1 lg:row-span-2 lg:col-start-3 lg:min-h-0" />
          <CollectionTile {...tile2} className="min-h-[200px] lg:col-span-1 lg:row-start-3 lg:min-h-0" />
          <CollectionTile {...tile3} className="min-h-[200px] lg:col-span-2 lg:row-start-3 lg:col-start-2 lg:min-h-0" />
        </div>
      </section>

      {/* Lookbook row — links into full /lookbook screen */}
      <section id="lookbook" className="scroll-mt-28 border-y border-[var(--lf-line)] bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">
                Studio lookbook
              </h2>
              <p className="mt-2 max-w-xl text-sm text-[var(--lf-muted)]">
                A week of moods from the atelier—open a day to shop the pairing on the lookbook page.
              </p>
            </div>
            <Link
              href="/lookbook"
              className="shrink-0 text-sm font-semibold text-[var(--lf-purple-deep)] underline-offset-4 transition hover:text-[var(--lf-purple)] hover:underline"
            >
              Full screen lookbook →
            </Link>
          </div>
          <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden">
            {landingMedia.lookbook.map((d) => (
              <Link
                key={d.label}
                href={d.href}
                className="group/lb block w-[42vw] max-w-[11rem] shrink-0 sm:w-44 sm:max-w-none"
              >
                <article>
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                    <LfRemoteImage
                      src={d.image}
                      alt={d.caption}
                      fill
                      className="object-cover transition duration-500 group-hover/lb:scale-105"
                      sizes="176px"
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[var(--lf-ink)]">{d.label}</p>
                  <p className="text-xs text-[var(--lf-muted)]">{d.caption}</p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sustainability / mission band */}
      <section className="relative min-h-[22rem] w-full lg:min-h-[26rem]">
        <LfRemoteImage
          src={landingMedia.sustainability}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[22rem] max-w-[1400px] items-center px-4 py-16 sm:px-6 lg:min-h-[26rem] lg:py-20">
          <div className="ml-auto max-w-lg lg:max-w-xl">
            <p className="font-serif text-3xl font-medium leading-snug text-white sm:text-4xl">
              High-quality modest clothing for every chapter—crafted with care in Osogbo.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/85">
              {site.mission[0].slice(0, 160)}…
            </p>
            <Link
              href="/craft-care"
              className="mt-8 inline-flex border border-white bg-white px-8 py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:bg-transparent hover:text-white"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Social strip */}
      <section className="lf-section-muted border-t border-[var(--lf-line)]">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)] sm:text-3xl">
            Follow {site.name}
          </h2>
          <p className="mt-1 text-sm text-[var(--lf-muted)]">
            @lizzyfusion on Instagram when you launch—placeholder grid for now.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {landingMedia.social.map((src) => (
              <div key={src} className="relative aspect-[4/5] overflow-hidden bg-zinc-200">
                <LfRemoteImage src={src} alt="" fill className="object-cover" sizes="240px" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Studio CTA */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 border border-[var(--lf-line)] bg-[var(--lf-purple-faint)] p-8 lg:grid-cols-2 lg:p-12">
          <div>
            <p className="section-title">Training & apprentices</p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-[var(--lf-ink)] sm:text-3xl">
              Grow inside the studio
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--lf-muted)]">
              {site.training.mode} {site.training.onlineNote}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/training" className="btn-primary !rounded-none">
                Training intake
              </Link>
              <Link href="/apprentice" className="btn-secondary !rounded-none">
                Apprentice hub
              </Link>
            </div>
          </div>
          <div className="flex flex-col justify-center border-t border-[var(--lf-line)] pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <p className="text-sm font-semibold text-[var(--lf-ink)]">Studio</p>
            <p className="mt-2 font-serif text-xl text-[var(--lf-ink)]">{site.location.line}</p>
            <a href={wa} target="_blank" rel="noreferrer" className="mt-4 text-sm font-semibold text-[var(--lf-purple)] hover:underline">
              Message on WhatsApp →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function CollectionTile({
  tile,
  href,
  className,
}: {
  tile: (typeof landingMedia.collectionTiles)[number];
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group/ct relative block min-h-[200px] overflow-hidden bg-zinc-100 ${className ?? ""}`}
    >
      <LfRemoteImage
        src={tile.image}
        alt={tile.label}
        fill
        className="object-cover transition duration-500 group-hover/ct:scale-105"
        sizes="(max-width: 768px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-80 transition group-hover/ct:opacity-90" />
      <span className="absolute bottom-4 left-4 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--lf-ink)]">
        {tile.label}
      </span>
    </Link>
  );
}

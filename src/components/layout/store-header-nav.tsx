"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { landingMedia, nav, navStorefront, site } from "@/lib/site";

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.49 5.49 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.49 5.49 0 0 0 0-7.78Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 7h12l-1 12H7L6 7Zm3-3h6v4H9V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const linkClass = "block py-1.5 text-sm text-[var(--lf-ink)] transition hover:text-[var(--lf-purple)]";

export function StoreHeaderNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const catLinks = site.specialties.slice(0, 8).map((label) => ({
    label,
    href: "/shop",
  }));

  return (
    <div className="border-b border-[var(--lf-line)] bg-white">
      <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center gap-3 lg:justify-start">
          <button
            type="button"
            className="rounded-md p-2 text-[var(--lf-ink)] lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
            onClick={() => setMobileOpen(true)}
          >
            <IconMenu />
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="relative h-10 w-36 shrink-0 sm:h-11 sm:w-40">
              <Image
                src={site.logo}
                alt={site.name}
                fill
                className="object-contain object-left"
                sizes="160px"
                priority
              />
            </span>
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-8 lg:flex" aria-label="Primary">
          {navStorefront.map((item) => (
            <MegaTrigger key={item.id} item={item} catLinks={catLinks} />
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button
            type="button"
            className="hidden rounded-md p-2 text-[var(--lf-ink)] hover:bg-zinc-100 sm:block"
            aria-label="Search (coming soon)"
          >
            <IconSearch />
          </button>
          <Link
            href="/contact"
            className="hidden rounded-md p-2 text-[var(--lf-ink)] hover:bg-zinc-100 sm:block"
            aria-label="Contact"
          >
            <IconUser />
          </Link>
          <Link
            href="/shop"
            className="hidden rounded-md p-2 text-[var(--lf-ink)] hover:bg-zinc-100 sm:block"
            aria-label="Wishlist"
          >
            <IconHeart />
          </Link>
          <Link
            href="/shop"
            className="rounded-md p-2 text-[var(--lf-ink)] hover:bg-zinc-100"
            aria-label="Shop bag"
          >
            <IconBag />
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-[60] flex lg:hidden"
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-[min(100%,22rem)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--lf-line)] px-4 py-3">
              <span className="font-serif text-lg font-semibold">{site.name}</span>
              <button
                type="button"
                className="rounded-md p-2"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
              >
                <IconClose />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                Shop
              </p>
              {navStorefront.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block border-b border-zinc-100 py-3 text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                Studio
              </p>
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block border-b border-zinc-100 py-3 text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MegaTrigger({
  item,
  catLinks,
}: {
  item: (typeof navStorefront)[number];
  catLinks: { label: string; href: string }[];
}) {
  return (
    <div className="group relative">
      <Link
        href={item.href}
        className="inline-flex items-center gap-1 py-2 text-sm font-medium text-[var(--lf-ink)] transition hover:text-[var(--lf-purple)]"
      >
        {item.label}
      </Link>
      <div
        className="pointer-events-none invisible absolute left-1/2 top-full z-40 w-screen max-w-[100vw] -translate-x-1/2 opacity-0 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)] transition duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100"
        style={{ marginTop: "1px" }}
      >
        <div className="mx-auto max-w-[1400px] border-t border-[var(--lf-line)] bg-white px-6 py-10">
          {item.id === "collection" ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr_1fr_minmax(0,11rem)_minmax(0,11rem)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Category
                </p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <Link href="/shop" className={linkClass}>
                      Shop all
                    </Link>
                  </li>
                  {catLinks.map((c) => (
                    <li key={c.label}>
                      <Link href={c.href} className={linkClass}>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Featured
                </p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <Link href="/shop#best-sellers" className={linkClass}>
                      New arrivals
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop" className={linkClass}>
                      Best sellers
                    </Link>
                  </li>
                  <li>
                    <Link href="/custom" className={linkClass}>
                      Custom desk
                    </Link>
                  </li>
                  <li>
                    <Link href="/training" className={linkClass}>
                      In-person training
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  More
                </p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <Link href="/apprentice" className={linkClass}>
                      Apprentice hub
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className={linkClass}>
                      Our story
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className={linkClass}>
                      Book a fitting
                    </Link>
                  </li>
                </ul>
              </div>
              <MegaImageCard
                href="/shop"
                label="Wedding & reception"
                src={landingMedia.collectionTiles[0].image}
              />
              <MegaImageCard
                href="/shop"
                label="Aso-ebi & groups"
                src={landingMedia.collectionTiles[1].image}
              />
            </div>
          ) : null}
          {item.id === "new-in" ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,14rem)_minmax(0,14rem)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  New in Osogbo
                </p>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--lf-muted)]">
                  Latest ready-to-wear drops and made-to-order slots. Prices in naira—confirm
                  availability on WhatsApp after you enquire from the shop.
                </p>
                <Link
                  href="/shop#best-sellers"
                  className="mt-6 inline-block text-sm font-semibold text-[var(--lf-purple)] underline-offset-4 hover:underline"
                >
                  View best sellers
                </Link>
              </div>
              <MegaImageCard href="/shop" label="Layered sets" src={landingMedia.lookbook[0].image} />
              <MegaImageCard href="/shop" label="Evening mood" src={landingMedia.lookbook[1].image} />
            </div>
          ) : null}
          {item.id === "lookbook" ? (
            <div className="grid gap-8 lg:grid-cols-4">
              {landingMedia.lookbook.map((d) => (
                <Link key={d.label} href="/#lookbook" className="group/card block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                    <Image
                      src={d.image}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover/card:scale-105"
                      sizes="200px"
                    />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{d.label}</p>
                  <p className="text-xs text-[var(--lf-muted)]">{d.caption}</p>
                </Link>
              ))}
            </div>
          ) : null}
          {item.id === "occasions" ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr_minmax(0,14rem)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  For every chapter
                </p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <Link href="/custom" className={linkClass}>
                      Wedding & reception
                    </Link>
                  </li>
                  <li>
                    <Link href="/custom" className={linkClass}>
                      Aso-ebi coordination
                    </Link>
                  </li>
                  <li>
                    <Link href="/custom" className={linkClass}>
                      Church & civil
                    </Link>
                  </li>
                  <li>
                    <Link href="/custom" className={linkClass}>
                      Office & boardroom
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Fit & sizing
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--lf-muted)]">
                  Bespoke and made-to-measure appointments in {site.location.city}. Share your
                  timeline and references—we reply on WhatsApp with next steps.
                </p>
                <Link
                  href="/custom"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--lf-purple)] underline-offset-4 hover:underline"
                >
                  Start a custom request
                </Link>
              </div>
              <MegaImageCard href="/custom" label="Occasion couture" src={landingMedia.hero} />
            </div>
          ) : null}
          {item.id === "sustainability" ? (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,14rem)_1fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Craft & care
                </p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <Link href="/about" className={linkClass}>
                      Mission & vision
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className={linkClass}>
                      Ethical practices
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className={linkClass}>
                      Fabric sourcing
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className={linkClass}>
                      Care & alterations
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="relative aspect-[3/4] max-h-[22rem] overflow-hidden bg-zinc-100">
                <Image
                  src={landingMedia.sustainability}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
              <div className="relative aspect-[3/4] max-h-[22rem] overflow-hidden bg-zinc-100">
                <Image
                  src="https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80&auto=format&fit=crop"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MegaImageCard({ href, label, src }: { href: string; label: string; src: string }) {
  return (
    <Link href={href} className="group/img block">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover/img:scale-105"
          sizes="180px"
        />
      </div>
      <p className="mt-3 text-sm font-medium">{label}</p>
    </Link>
  );
}

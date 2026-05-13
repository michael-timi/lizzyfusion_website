"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CatalogPriceStack } from "@/components/shop/catalog-price-stack";
import { WishlistHeart } from "@/components/shop/wishlist-heart";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import type { CatalogProduct } from "@/lib/catalog";
import { catalogWhatsappPriceLine } from "@/lib/catalog-pricing";
import { sampleProducts, site, whatsappHref } from "@/lib/site";
import { getWishlistSlugs, subscribeWishlistStore } from "@/lib/wishlist";

export function WishlistView() {
  const [remoteCatalog, setRemoteCatalog] = useState<CatalogProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/catalog")
      .then((r) => r.json())
      .then((body: { products?: CatalogProduct[] }) => {
        if (cancelled || !body?.products || !Array.isArray(body.products)) return;
        setRemoteCatalog(body.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const slugKey = useSyncExternalStore(
    subscribeWishlistStore,
    () => getWishlistSlugs().slice().sort().join("\0"),
    () => "",
  );

  const slugs = useMemo(() => (slugKey ? slugKey.split("\0") : []), [slugKey]);

  const items = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    for (const p of sampleProducts) map.set(p.slug, { ...p });
    if (remoteCatalog) {
      for (const p of remoteCatalog) {
        if (typeof p.slug === "string" && p.slug) map.set(p.slug, p);
      }
    }
    return slugs.map((s) => map.get(s)).filter((p): p is CatalogProduct => Boolean(p));
  }, [slugs, remoteCatalog]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-center font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">
        My wish list
      </h1>
      <p className="mt-3 text-center text-sm text-[var(--lf-muted)]">
        {items.length} {items.length === 1 ? "item" : "items"}
      </p>

      {items.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md rounded-lg border border-dashed border-[var(--lf-line)] bg-zinc-50 px-8 py-14 text-center">
          <p className="text-[var(--lf-muted)]">
            Pieces you save from the shop or home page appear here on this device.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex border border-[var(--lf-ink)] bg-[var(--lf-ink)] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple-deep)]"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const msg = whatsappHref(
              [
                `*${site.name} — wishlist enquiry*`,
                `Product: ${p.name}`,
                catalogWhatsappPriceLine(p),
              ].join("\n"),
            );
            return (
              <li key={p.slug} className="group/card border border-[var(--lf-line)] bg-white shadow-sm">
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                  <Link href={`/shop/${p.slug}`} className="block h-full w-full">
                    <LfRemoteImage
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition duration-500 group-hover/card:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </Link>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <WishlistHeart slug={p.slug} className="shrink-0 shadow-md" />
                      <div className="min-w-0">
                        <Link
                          href={`/shop/${p.slug}`}
                          className="font-semibold text-[var(--lf-ink)] hover:text-[var(--lf-purple-deep)]"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-sm text-[var(--lf-muted)]">{p.tag}</p>
                      </div>
                    </div>
                    <CatalogPriceStack product={p} />
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    {["#2d2d2d", "#6b5b4b", "#8b7355"].map((hex) => (
                      <span
                        key={hex}
                        className="h-4 w-4 rounded-full border border-zinc-200"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 border-t border-[var(--lf-line)] pt-4">
                    <a
                      href={msg}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full border border-[var(--lf-ink)] bg-[var(--lf-ink)] py-2.5 text-center text-xs font-semibold text-white transition hover:bg-[var(--lf-purple-deep)]"
                    >
                      Enquire on WhatsApp
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

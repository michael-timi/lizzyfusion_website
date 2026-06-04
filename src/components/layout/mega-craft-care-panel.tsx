"use client";

import Link from "next/link";
import { craftCare, craftCareOlive } from "@/lib/craft-care";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { CraftCareBreadcrumb } from "@/components/craft-care/craft-care-breadcrumb";
import { resolveProductImages, useMegaCatalog } from "@/components/layout/use-mega-catalog";

/**
 * The Craft & care tiles are editorial (not product-pinned), so we resolve a distinct real
 * uploaded dress per tile by keyword, keeping the editorial photo as a fallback.
 */
const heroKeywords = ["reception", "gown"] as const;
const tileKeywordsByLabel: Record<string, readonly string[]> = {
  "Our story": ["bridal", "wedding"],
  Materials: ["abaya", "ready-to-wear"],
  Packaging: ["aso-ebi"],
  "Product care": ["office", "church"],
};

/** Mega menu preview for Craft & care — links into full editorial hub and subpages. */
export function MegaCraftCarePanel() {
  const catalog = useMegaCatalog();
  const [heroImage, ...tileImages] = resolveProductImages(catalog, [
    { keywords: heroKeywords, fallback: craftCare.hubHero.image },
    ...craftCare.categoryTiles.map((tile) => ({
      keywords: tileKeywordsByLabel[tile.label] ?? [],
      fallback: tile.image,
    })),
  ]);
  return (
    <div className="space-y-8">
      <CraftCareBreadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Craft & care", href: "/craft-care" }]}
      />

      <div className="relative min-h-[min(14rem,28vh)] w-full overflow-hidden rounded-sm border border-[var(--lf-line)] bg-zinc-100 sm:min-h-[min(16rem,32vh)]">
        <LfRemoteImage
          src={heroImage}
          alt=""
          fill
          className="object-cover object-[center_40%]"
          sizes="(max-width:1400px) 100vw, 1400px"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" aria-hidden />
        <div className="relative z-10 flex min-h-[min(14rem,28vh)] flex-col justify-end px-5 py-6 sm:min-h-[min(16rem,32vh)] sm:px-8 sm:py-8 lg:max-w-lg">
          <p className="font-serif text-xl font-medium leading-snug text-white sm:text-2xl">{craftCare.hubHero.line}</p>
          <Link
            href="/craft-care"
            className="mt-4 inline-flex w-fit items-center border border-white/90 bg-white/95 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--lf-ink)] transition hover:bg-white"
          >
            Open Craft &amp; care
          </Link>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4">
        {craftCare.categoryTiles.map((tile, i) => (
          <li key={tile.label}>
            <Link href={tile.href} className="group/tile block">
              <div className="relative aspect-[5/4] overflow-hidden bg-zinc-100">
                <LfRemoteImage
                  src={tileImages[i] ?? tile.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover/tile:scale-105"
                  sizes="25vw"
                />
                <div
                  className="absolute inset-x-0 bottom-0 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-white sm:text-xs"
                  style={{ backgroundColor: craftCareOlive }}
                >
                  {tile.label}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-[var(--lf-muted)]">
        Principles, packaging, product care, and the studio bench—full story on{" "}
        <Link href="/craft-care" className="font-semibold text-[var(--lf-purple)] underline-offset-2 hover:underline">
          Craft &amp; care
        </Link>
        . Fibre deep-dive on{" "}
        <Link
          href="/craft-care/materials"
          className="font-semibold text-[var(--lf-purple)] underline-offset-2 hover:underline"
        >
          Materials
        </Link>
        .
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import {
  LookbookScreen,
  LookbookScreenFallback,
  type ResolvedLook,
} from "@/components/shop/lookbook-screen";
import { getMergedCatalog } from "@/lib/catalog";
import { resolveLookPair } from "@/lib/site-featured";
import { getSiteFeatured } from "@/lib/site-featured-server";
import { landingMedia, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lookbook",
  description: `A week of styled looks from ${site.name}—shop each pairing in naira and enquire on WhatsApp.`,
};

export default async function LookbookPage() {
  const [catalog, featured] = await Promise.all([getMergedCatalog(), getSiteFeatured()]);

  // Resolve the "shop the look" pair for each day server-side: admin pins win, then keyword
  // resolution, then null. No hard-coded slugs anywhere.
  const resolved: ResolvedLook[] = landingMedia.lookbook.map((look) => {
    const { pair } = resolveLookPair(featured, catalog, look);
    return {
      label: look.label,
      caption: look.caption,
      href: look.href,
      image: look.image,
      heroImage: look.heroImage,
      badgeNewOnIndex: "badgeNewOnIndex" in look ? look.badgeNewOnIndex : undefined,
      pair: pair ? [pair[0], pair[1]] : null,
    };
  });

  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<LookbookScreenFallback />}>
        <LookbookScreen looks={resolved} />
      </Suspense>
    </main>
  );
}

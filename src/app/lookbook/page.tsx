import type { Metadata } from "next";
import { Suspense } from "react";
import { LookbookScreen, LookbookScreenFallback } from "@/components/shop/lookbook-screen";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lookbook",
  description: `A week of styled looks from ${site.name}—shop each pairing in naira and enquire on WhatsApp.`,
};

export default function LookbookPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<LookbookScreenFallback />}>
        <LookbookScreen />
      </Suspense>
    </main>
  );
}

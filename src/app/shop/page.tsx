import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { ShopCatalog } from "@/components/shop/shop-catalog";
import { ShopHeroDual } from "@/components/shop/shop-hero-dual";
import { getMergedCatalog } from "@/lib/catalog";
import { site } from "@/lib/site";

type SearchParams = { q?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const baseDesc = `Browse ready-to-wear and made-to-order pieces from ${site.name}. Prices in Nigerian Naira; orders confirmed on WhatsApp.`;
  return {
    title: "Shop all",
    description: baseDesc,
    robots: query ? { index: false, follow: true } : { index: true, follow: true, "max-image-preview": "large" },
    alternates: { canonical: "/shop" },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const catalog = await getMergedCatalog();
  const filtered = !query
    ? catalog
    : catalog.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.tag.toLowerCase().includes(query.toLowerCase()),
      );

  const crumbLabel = query ? `Search · “${query}”` : "Shop all";

  return (
    <main>
      <section className="scroll-mt-32 border-b border-[var(--lf-line)] bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
          <nav className="text-sm text-[var(--lf-muted)]" aria-label="Breadcrumb">
            <Link href="/" className="transition hover:text-[var(--lf-ink)]">
              Home
            </Link>
            <span className="mx-2 text-zinc-300" aria-hidden>
              /
            </span>
            <span className="font-medium text-[var(--lf-ink)]">{crumbLabel}</span>
          </nav>
        </div>
        <ShopHeroDual />
        <div
          id="lookbook"
          className="scroll-mt-28 border-t border-[var(--lf-line)] bg-zinc-50/90 px-4 py-3 text-center sm:px-6"
        >
          <Link
            href="/lookbook"
            className="text-sm font-semibold text-[var(--lf-purple-deep)] underline-offset-4 transition hover:text-[var(--lf-purple)] hover:underline"
          >
            Studio lookbook — styled by day →
          </Link>
        </div>
      </section>

      <div id="best-sellers" className="scroll-mt-32 bg-[#fafafa]">
        <ShopCatalog query={query} products={filtered} />
      </div>

      <section className="mx-auto max-w-[1400px] border-t border-[var(--lf-line)] px-4 py-16 sm:px-6">
        <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Send your details first</h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--lf-muted)]">
          Use this form when you want the studio to have your name, WhatsApp number, and city on file before you jump
          into chat—your summary still opens WhatsApp for you.
        </p>
        <div className="mt-8 max-w-xl">
          <LeadForm
            intent="Shop / catalogue enquiry"
            extraFields={[
              {
                key: "pieces",
                label: "Piece(s) or price range you have in mind",
                type: "textarea",
              },
            ]}
          />
        </div>
      </section>
    </main>
  );
}

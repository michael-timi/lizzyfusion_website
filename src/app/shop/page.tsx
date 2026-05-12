import type { Metadata } from "next";
import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { formatNgn, sampleProducts, site, whatsappHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop",
  description: `Browse ready-to-wear and made-to-order pieces from ${site.name}. Prices in Nigerian Naira; orders confirmed on WhatsApp.`,
};

export default function ShopPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <p className="section-title">Collections</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Shop & enquire</h1>
      <p className="mt-4 max-w-2xl text-[var(--lf-muted)]">
        Prices are listed in{" "}
        <strong className="font-medium text-zinc-800">Nigerian Naira (₦)</strong>.
        Ready-to-wear and made-to-order pieces are fulfilled from Osogbo—quick WhatsApp
        links open a prefilled message you can edit. Use the form below when you want
        your contact details bundled before chat.
      </p>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sampleProducts.map((p) => {
          const msg = whatsappHref(
            [
              `*${site.name} — product enquiry*`,
              `Product: ${p.name}`,
              `Listed price: ${formatNgn(p.price)}`,
              `My name / size / colour preference:`,
              `(please fill before sending)`,
            ].join("\n"),
          );
          return (
            <li
              key={p.slug}
              className="flex flex-col rounded-2xl border border-[var(--lf-line)] bg-white p-6 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--lf-purple)]">
                {p.tag}
              </span>
              <h2 className="mt-2 text-lg font-semibold text-[var(--lf-ink)]">{p.name}</h2>
              <p className="mt-3 text-2xl font-semibold text-[var(--lf-ink)]">
                {formatNgn(p.price)}
              </p>
              <p className="mt-3 flex-1 text-sm text-[var(--lf-muted)]">{p.lead}</p>
              <div className="mt-6 flex flex-col gap-2">
                <a href={msg} target="_blank" rel="noreferrer" className="btn-primary text-center">
                  Enquire on WhatsApp
                </a>
                <Link href="/custom" className="btn-secondary text-center text-sm">
                  Need a custom version?
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="mt-16 border-t border-[var(--lf-line)] pt-16">
        <h2 className="text-xl font-semibold text-[var(--lf-ink)]">
          Send your details first
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[var(--lf-muted)]">
          Use this form when you want the studio to have your name, WhatsApp number, and
          city on file before you jump into chat—your summary still opens WhatsApp for
          you.
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

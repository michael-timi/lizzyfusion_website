import Link from "next/link";
import { site, whatsappHref } from "@/lib/site";

const blocks = [
  {
    title: "Shop & catalogue",
    body: "Search, filters, PDP, wishlist, and cart feed WhatsApp and checkout. Monitor orders in the Orders tab after payment.",
    href: "/shop",
    cta: "Open shop",
  },
  {
    title: "Checkout & payments",
    body: "Signed-in checkout collects shipping, then payment step. Successful orders write to Firestore and should appear in Orders.",
    href: "/checkout/info",
    cta: "Checkout flow",
  },
  {
    title: "Bespoke & custom",
    body: "Marketing routes for made-to-measure and group aso-ebi; fulfilment stays on WhatsApp with the studio.",
    href: "/custom",
    cta: "Custom page",
  },
  {
    title: "Training & apprentices",
    body: "Intake copy and links for studio programmes—no separate applicant database in this build.",
    href: "/training",
    cta: "Training",
  },
  {
    title: "Lookbook",
    body: "Editorial week view tied to sample PDP pairs—swap photography in site config when ready.",
    href: "/lookbook",
    cta: "Lookbook",
  },
  {
    title: "Craft & care",
    body: "Materials story and sustainability copy; public hub separate from this admin.",
    href: "/craft-care",
    cta: "Craft & care",
  },
] as const;

export function AdminProcessesView() {
  const wa = whatsappHref(
    `Hello ${site.name}, this is an admin process check from the dashboard. Please confirm any open enquiries.`,
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Operational map</h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--lf-muted)]">
          Each block links to the live customer experience. Use Orders + WhatsApp together for fulfilment.
        </p>
      </div>

      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col rounded-xl border border-[#128C7E]/30 bg-[#e7f7ef] p-5 transition hover:border-[#128C7E]"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#075e54]">Primary channel</span>
        <span className="mt-1 text-lg font-semibold text-[var(--lf-ink)]">WhatsApp studio line</span>
        <span className="mt-1 text-sm text-[var(--lf-muted)]">{site.contact.phoneDisplay}</span>
      </a>

      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((b) => (
          <div key={b.title} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-[var(--lf-ink)]">{b.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--lf-muted)]">{b.body}</p>
            <Link
              href={b.href}
              className="mt-4 inline-flex text-sm font-semibold text-[var(--lf-purple)] hover:underline"
            >
              {b.cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

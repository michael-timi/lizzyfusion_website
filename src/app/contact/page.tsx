import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${site.name} in ${site.location.line}. WhatsApp, phone, and email.`,
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="section-title">Reach the studio</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-4 text-[var(--lf-muted)]">{site.location.line}</p>

      <div className="mt-8 space-y-3 text-sm">
        <p>
          <span className="font-semibold text-zinc-800">Phone / WhatsApp:</span>{" "}
          <a className="text-[var(--lf-purple)] hover:underline" href={`tel:+${site.contact.phoneWa}`}>
            {site.contact.phoneDisplay}
          </a>
        </p>
        <p>
          <span className="font-semibold text-zinc-800">Email:</span>{" "}
          <a className="text-[var(--lf-purple)] hover:underline" href={`mailto:${site.contact.email}`}>
            {site.contact.email}
          </a>
        </p>
      </div>

      <div className="mt-10">
        <LeadForm intent="General enquiry" />
      </div>
    </main>
  );
}

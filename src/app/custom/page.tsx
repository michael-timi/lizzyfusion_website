import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Custom & bespoke",
  description: `Request bespoke or custom modest fashion from ${site.name} in ${site.location.line}.`,
};

export default function CustomPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="section-title">Bespoke desk</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Custom design & fittings</h1>
      <p className="mt-4 text-[var(--lf-muted)]">
        Share the occasion, inspiration, and timeline. {site.name} will continue the
        conversation on WhatsApp or email with fabric options, measurements, and
        pricing tailored to you.
      </p>

      <div className="mt-10">
        <LeadForm
          intent="Custom / bespoke enquiry"
          extraFields={[
            { key: "occasion", label: "Occasion or brief" },
            { key: "eventDate", label: "Event date (if any)" },
            { key: "budget", label: "Budget range (₦)" },
            { key: "refs", label: "Reference links or notes", type: "textarea" },
          ]}
        />
      </div>
    </main>
  );
}

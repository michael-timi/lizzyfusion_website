import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Training",
  description: `In-person fashion training with ${site.name} in ${site.location.city}, ${site.location.state}.`,
};

export default function TrainingPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="section-title">Studio school</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">In-person training</h1>
      <p className="mt-4 text-[var(--lf-muted)]">{site.training.mode}</p>
      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {site.training.onlineNote}
      </p>

      <ul className="mt-8 list-disc space-y-2 pl-5 text-sm text-[var(--lf-muted)]">
        <li>Small-group and one-to-one options depending on intake.</li>
        <li>Materials list and fee schedule are shared after you register interest.</li>
        <li>Certificates or completion criteria can be discussed for each cohort.</li>
      </ul>

      <div className="mt-10">
        <LeadForm
          intent="Training registration"
          extraFields={[
            { key: "program", label: "Programme of interest (e.g. sewing fundamentals)" },
            { key: "experience", label: "Prior experience" },
            { key: "start", label: "Preferred start window" },
          ]}
        />
      </div>
    </main>
  );
}

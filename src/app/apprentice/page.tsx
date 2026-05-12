import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Apprentices",
  description: `Apprentice growth and studio learning with ${site.name} in Osogbo.`,
};

export default function ApprenticePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="section-title">Apprentice hub</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Track your craft journey</h1>
      <p className="mt-4 text-[var(--lf-muted)]">
        We are rolling out a dedicated apprentice space for assignments, skill
        milestones, and mentor feedback—so growth is visible week to week, not only in
        chat threads.
      </p>

      <section className="mt-8 rounded-2xl border border-[var(--lf-line)] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lf-purple)]">
          Planned features
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[var(--lf-muted)]">
          <li>Skills matrix (construction, finishing, pattern, draping).</li>
          <li>Assignment log with due dates and studio notes.</li>
          <li>Resource library for approved patterns and technique videos.</li>
        </ul>
      </section>

      <div className="mt-10">
        <LeadForm
          intent="Apprentice portal access"
          extraFields={[
            { key: "stage", label: "Current stage with studio (e.g. interview, week 4)" },
            { key: "goals", label: "What you want to improve next", type: "textarea" },
          ]}
        />
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Until the portal is live, submissions route to the same WhatsApp / email desk so
        nothing is lost.
      </p>
    </main>
  );
}

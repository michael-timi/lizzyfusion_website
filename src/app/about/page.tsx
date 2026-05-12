import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Vision, mission, and brand story for ${site.name} in ${site.location.line}.`,
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="section-title">Brand story</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">About {site.name}</h1>
      <p className="mt-2 text-lg text-[var(--lf-purple)]">{site.slogan}</p>

      <section className="mt-10 space-y-4 text-[var(--lf-muted)] leading-relaxed">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lf-ink)]">
          Vision
        </h2>
        <p>{site.vision}</p>
      </section>

      <section className="mt-10 space-y-4 text-[var(--lf-muted)] leading-relaxed">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lf-ink)]">
          Mission
        </h2>
        {site.mission.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-[var(--lf-line)] bg-[var(--lf-purple-faint)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lf-purple)]">
          Specialties
        </h2>
        <p className="mt-3 text-sm text-[var(--lf-muted)]">
          {site.specialties.join(" · ")}.
        </p>
      </section>
    </main>
  );
}

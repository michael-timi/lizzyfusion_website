import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Policies",
  description: `Terms and privacy information for ${site.name}.`,
};

export default function PoliciesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:py-20">
      <p className="section-title">Legal</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)]">Studio policies</h1>
      <p className="mt-4 text-sm text-[var(--lf-muted)]">
        These summaries support the registration flow. For bespoke contracts or group orders, we will share formal
        terms by email or in studio.
      </p>

      <section id="terms" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-[var(--lf-ink)]">Terms &amp; conditions</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--lf-muted)]">
          <li>Prices on the site are indicative in Nigerian Naira; final quotes may depend on fabric and fittings.</li>
          <li>Ready-to-wear and custom timelines are confirmed on WhatsApp or email after you enquire.</li>
          <li>By creating an account when available, you agree we may contact you about orders and studio updates.</li>
        </ul>
      </section>

      <section id="privacy" className="mt-12 scroll-mt-24">
        <h2 className="text-lg font-semibold text-[var(--lf-ink)]">Privacy policy</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--lf-muted)]">
          <li>We collect only what you submit (for example name, email, and messages) to respond to enquiries.</li>
          <li>
            <span className="font-medium text-[var(--lf-ink)]">Accounts &amp; checkout:</span> sign-in uses{" "}
            <a
              href="https://firebase.google.com/support/privacy"
              className="text-[var(--lf-purple)] underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Google Firebase Authentication
            </a>
            . Optional Google sign-in is subject to Google&apos;s policies as well.
          </li>
          <li>
            When you complete checkout while signed in, a summary of your bag and delivery details (never card numbers)
            may be stored in our Firebase database so the studio can match your WhatsApp order to your account.
          </li>
          <li>We do not sell your data. Messages via WhatsApp are subject to Meta&apos;s policies as well.</li>
          <li>
            Questions: reach us on the{" "}
            <Link href="/contact" className="text-[var(--lf-purple)] underline-offset-2 hover:underline">
              Contact
            </Link>{" "}
            page.
          </li>
        </ul>
      </section>
    </main>
  );
}

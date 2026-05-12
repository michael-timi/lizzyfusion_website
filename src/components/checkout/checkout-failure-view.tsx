import Link from "next/link";
import { site } from "@/lib/site";

function IconAlert({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 7v9" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1.35" fill="currentColor" />
    </svg>
  );
}

export function CheckoutFailureView() {
  return (
    <main className="mx-auto flex min-h-[min(72vh,40rem)] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-600 text-white"
        aria-hidden
      >
        <IconAlert />
      </div>
      <h1 className="mt-8 font-sans text-3xl font-semibold tracking-tight text-red-600 sm:text-4xl">
        Sorry, payment failed
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--lf-ink)] sm:text-base">
        Unfortunately, your order cannot be completed on this screen. {site.name} confirms payment and production on
        WhatsApp—please make sure the billing details you entered match what you send to the team.
      </p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--lf-ink)] sm:text-base">
        Alternatively, try again from payment, or reach us on WhatsApp with a different card or transfer option if your
        bank declined the request.
      </p>
      <Link
        href="/checkout/payment"
        className="mt-10 flex w-full max-w-xs items-center justify-center bg-[var(--lf-purple-deep)] px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
      >
        Try payment again
      </Link>
      <Link
        href="/cart"
        className="mt-6 text-sm font-medium text-[var(--lf-ink)] underline-offset-4 transition hover:text-[var(--lf-purple-deep)] hover:underline"
      >
        ← Back to your bag
      </Link>
    </main>
  );
}

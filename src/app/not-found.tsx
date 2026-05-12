import Link from "next/link";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="flex min-h-[min(70vh,32rem)] flex-col items-center justify-center bg-white px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lf-muted)]">404</p>
      <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--lf-muted)]">
        That link may be out of date, or the page has moved. Try the shop, lookbook, or reach {site.name} from
        Contact.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex border border-[var(--lf-ink)] bg-[var(--lf-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple-deep)]"
        >
          Home
        </Link>
        <Link
          href="/shop"
          className="inline-flex border border-[var(--lf-line)] bg-white px-6 py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)]"
        >
          Shop
        </Link>
        <Link href="/contact" className="text-sm font-semibold text-[var(--lf-purple-deep)] underline-offset-2 hover:underline">
          Contact
        </Link>
      </div>
    </main>
  );
}

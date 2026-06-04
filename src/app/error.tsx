"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackException } from "@/lib/analytics-events";
import { site } from "@/lib/site";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    const detail = error.digest ? `${error.message} (digest ${error.digest})` : error.message;
    void trackException(`render: ${detail || error.name}`, true);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[min(72vh,40rem)] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--lf-purple)]">
        Something went wrong
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">
        We hit a snag loading this page
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--lf-muted)] sm:text-base">
        Please try again. If it keeps happening, reach the studio in {site.location.city} and
        we&apos;ll help right away.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center rounded-full bg-[var(--lf-purple-deep)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-[var(--lf-ink)] bg-white px-6 py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple)]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

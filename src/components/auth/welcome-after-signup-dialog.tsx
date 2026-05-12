"use client";

import Link from "next/link";
import { useEffect } from "react";
import { site } from "@/lib/site";

type WelcomeAfterSignupDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function WelcomeAfterSignupDialog({ open, onClose }: WelcomeAfterSignupDialogProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-signup-title"
        className="relative w-full max-w-md border border-[var(--lf-line)] bg-white px-6 pb-12 pt-14 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.18)] sm:px-12"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 rounded p-2 text-[var(--lf-muted)] transition hover:bg-zinc-100 hover:text-[var(--lf-ink)]"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <h2
          id="welcome-signup-title"
          className="text-center text-2xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-[1.65rem]"
        >
          Welcome to {site.name}
        </h2>

        <p className="mt-5 text-center font-serif text-lg italic leading-snug text-[var(--lf-ink)] sm:text-xl">
          “{site.slogan}”
        </p>

        <p className="mt-8 text-center text-base font-semibold text-[var(--lf-ink)] sm:text-lg">
          Is it your first visit to {site.name}?
        </p>

        <div className="mt-10">
          <Link
            href="/shop"
            onClick={onClose}
            className="flex w-full justify-center border border-transparent bg-[var(--lf-purple)] px-8 py-3.5 text-sm font-medium text-white transition hover:bg-[var(--lf-purple-deep)] sm:mx-auto sm:max-w-sm"
          >
            Create your own style
          </Link>
        </div>
      </div>
    </div>
  );
}

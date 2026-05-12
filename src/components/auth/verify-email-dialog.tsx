"use client";

import { useEffect } from "react";
import Link from "next/link";

function titleCaseWords(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

type VerifyEmailDialogProps = {
  email: string;
  open: boolean;
  onClose: () => void;
};

export function VerifyEmailDialog({ email, open, onClose }: VerifyEmailDialogProps) {
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-email-title"
        className="relative w-full max-w-md border border-[var(--lf-line)] bg-white px-6 pb-10 pt-14 shadow-xl sm:px-10"
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
          id="verify-email-title"
          className="text-center text-xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-2xl"
        >
          {titleCaseWords("Verify your email address")}
        </h2>
        <p className="mt-6 text-center text-sm leading-relaxed text-[var(--lf-muted)]">
          {titleCaseWords("We've sent an email to")}{" "}
          <span className="font-medium text-[var(--lf-ink)]">{email}</span>{" "}
          {titleCaseWords(
            "to verify your email address and activate your account. The link in the email will expire in 24 hours.",
          )}
        </p>
        <p className="mt-6 text-center text-xs leading-relaxed text-[var(--lf-muted)] sm:text-sm">
          <Link
            href="/contact"
            className="font-medium text-[var(--lf-purple)] underline-offset-2 hover:underline"
            onClick={onClose}
          >
            {titleCaseWords("Click here")}
          </Link>{" "}
          {titleCaseWords(
            "if you did not receive an email or would like to change the email address you registered with",
          )}
          .
        </p>
        <p className="mt-8 text-center text-xs text-[var(--lf-muted)]">
          Member accounts are in soft launch—if nothing arrives, reach us on WhatsApp from{" "}
          <Link href="/contact" className="text-[var(--lf-purple)] underline-offset-2 hover:underline">
            Contact
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

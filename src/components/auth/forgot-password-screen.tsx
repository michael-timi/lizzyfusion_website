"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { firebaseAuthErrorMessage, sendPasswordReset } from "@/lib/firebase-auth";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { site } from "@/lib/site";

const fieldClass =
  "w-full border border-[var(--lf-ink)] bg-white px-4 py-3 text-sm text-[var(--lf-ink)] outline-none placeholder:text-zinc-400 focus:border-[var(--lf-purple)] focus:ring-1 focus:ring-[var(--lf-purple)]";

export function ForgotPasswordScreen() {
  const searchParams = useSearchParams();
  const { configured } = useFirebaseAuth();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter the email you use for your account.");
      return;
    }
    if (!configured) {
      setError("Password reset is not available until Firebase is configured (.env.local).");
      return;
    }
    setPending(true);
    try {
      await sendPasswordReset(email);
      setStatus(
        "If an account exists for that email, we sent a reset link. Check your inbox and spam folder, then return to log in.",
      );
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <h1 className="text-center font-sans text-2xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-3xl">
        Reset password
      </h1>
      <p className="mt-3 text-center text-sm leading-relaxed text-[var(--lf-muted)]">
        Enter your email and we will send a secure link from {site.name} via Firebase to choose a new password.
      </p>

      <form className="mt-10 space-y-4" onSubmit={handleSubmit} noValidate>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {status ? (
          <p className="text-sm leading-relaxed text-[var(--lf-muted)]" role="status">
            {status}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-[var(--lf-purple)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple-deep)] disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-[var(--lf-muted)]">
        <Link href="/login" className="font-semibold text-[var(--lf-ink)] underline-offset-2 hover:underline">
          Back to log in
        </Link>
      </p>
    </main>
  );
}

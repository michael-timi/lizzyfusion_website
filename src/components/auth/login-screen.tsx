"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { sanitizeNextParam } from "@/lib/auth-redirect";
import { AuthErrorBanner, AuthNoticeBanner, AuthSuccessBanner } from "@/components/auth/auth-feedback";
import { firebaseAuthErrorMessage, signInWithEmailPassword, signInWithGoogle } from "@/lib/firebase-auth";
import { landingMedia, site } from "@/lib/site";
import { AuthSocialSection } from "./auth-social-section";
import { useFirebaseAuth } from "./firebase-auth-provider";

const REDIRECT_MS = 900;

function IconEye({ crossed }: { crossed?: boolean }) {
  if (crossed) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--lf-muted)]">
        <path
          d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.4 10.4 0 0 1 12 5c4 0 7.3 2.6 9 6a9.7 9.7 0 0 1-4.1 4.3M6.2 6.2C4 7.9 2.5 10.3 2 12c1.7 3.4 5 6 9 6 1.1 0 2.1-.2 3.1-.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--lf-muted)]">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const fieldClass =
  "w-full border border-[var(--lf-ink)] bg-white px-4 py-3 text-sm text-[var(--lf-ink)] outline-none placeholder:text-zinc-400 focus:border-[var(--lf-purple)] focus:ring-1 focus:ring-[var(--lf-purple)]";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configured } = useFirebaseAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const afterLoginPath = useMemo(
    () => sanitizeNextParam(searchParams.get("next")),
    [searchParams],
  );

  const registerHref = useMemo(() => {
    return afterLoginPath !== "/"
      ? `/register?next=${encodeURIComponent(afterLoginPath)}`
      : "/register";
  }, [afterLoginPath]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current != null) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, []);

  function clearFeedback() {
    setError(null);
    setNotice(null);
    setSuccessMessage(null);
  }

  function scheduleRedirect() {
    if (redirectTimerRef.current != null) clearTimeout(redirectTimerRef.current);
    redirectTimerRef.current = setTimeout(() => {
      redirectTimerRef.current = null;
      router.replace(afterLoginPath);
    }, REDIRECT_MS);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter the email you registered with.");
      return;
    }
    if (password.length < 1) {
      setError("Please enter your password.");
      return;
    }
    if (!configured) {
      setNotice("Sign-in is not configured yet. Add Firebase keys to .env.local and restart the dev server.");
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmailPassword(email, password);
      setSuccessMessage("Signed in successfully. Redirecting…");
      scheduleRedirect();
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    clearFeedback();
    if (!configured) {
      setNotice("Sign-in is not configured yet. Add Firebase keys to .env.local and restart the dev server.");
      return;
    }
    setGooglePending(true);
    try {
      await signInWithGoogle();
      setSuccessMessage("Signed in with Google. Redirecting…");
      scheduleRedirect();
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
    } finally {
      setGooglePending(false);
    }
  }

  const formLocked = submitting || Boolean(successMessage);

  return (
    <>
      <div className="relative aspect-[5/4] lg:hidden">
        <LfRemoteImage
          src={landingMedia.authPanel}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </div>
      <div className="grid min-h-0 lg:min-h-[calc(100dvh-6rem)] lg:grid-cols-2">
        <div className="relative hidden min-h-[20rem] lg:block">
          <LfRemoteImage
            src={landingMedia.authPanel}
            alt=""
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />
        </div>

        <div className="flex flex-col justify-center bg-white px-6 py-14 sm:px-12 lg:px-16 xl:px-24">
          <h1 className="text-center font-sans text-2xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-3xl">
            Log in
          </h1>

          <form className="mx-auto mt-10 w-full max-w-md space-y-4" onSubmit={handleSubmit} noValidate>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={formLocked}
              className={fieldClass}
            />
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={formLocked}
                className={`${fieldClass} pr-12`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 hover:bg-zinc-100 disabled:opacity-40"
                onClick={() => setShowPassword((v) => !v)}
                disabled={formLocked}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <IconEye crossed={showPassword} />
              </button>
            </div>

            <div className="text-left">
              <Link
                href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
                className="text-sm text-[var(--lf-muted)] underline-offset-2 hover:text-[var(--lf-ink)] hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="space-y-3">
              {successMessage ? <AuthSuccessBanner>{successMessage}</AuthSuccessBanner> : null}
              {error ? <AuthErrorBanner>{error}</AuthErrorBanner> : null}
              {notice ? <AuthNoticeBanner>{notice}</AuthNoticeBanner> : null}
            </div>

            <button
              type="submit"
              disabled={formLocked}
              className="mt-1 w-full bg-[var(--lf-purple)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple-deep)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : successMessage ? "Redirecting…" : "Log in"}
            </button>
          </form>

          <AuthSocialSection
            className="mt-10"
            google={
              configured && !successMessage
                ? {
                    onClick: handleGoogle,
                    pending: googlePending,
                  }
                : undefined
            }
            pendingHint="Signing in with Google…"
          />

          <p className="mx-auto mt-10 max-w-md text-center text-sm text-[var(--lf-muted)]">
            New to {site.name}?{" "}
            <Link href={registerHref} className="font-semibold text-[var(--lf-ink)] underline-offset-2 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

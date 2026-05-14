"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { sanitizeNextParam } from "@/lib/auth-redirect";
import { AuthErrorBanner, AuthNoticeBanner, AuthSuccessBanner } from "@/components/auth/auth-feedback";
import { firebaseAuthErrorMessage, registerWithEmailPassword, signInWithGoogle } from "@/lib/firebase-auth";
import { landingMedia, site } from "@/lib/site";
import { AuthSocialSection } from "./auth-social-section";
import { useFirebaseAuth } from "./firebase-auth-provider";
import { VerifyEmailDialog } from "./verify-email-dialog";
import { WelcomeAfterSignupDialog } from "./welcome-after-signup-dialog";

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

export function RegisterScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configured } = useFirebaseAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const showWelcomeAfterVerifyClose = useRef(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const afterRegisterPath = useMemo(
    () => sanitizeNextParam(searchParams.get("next")),
    [searchParams],
  );

  const loginHref = useMemo(() => {
    return afterRegisterPath !== "/"
      ? `/login?next=${encodeURIComponent(afterRegisterPath)}`
      : "/login";
  }, [afterRegisterPath]);

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
      router.replace(afterRegisterPath);
    }, REDIRECT_MS);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!configured) {
      setNotice("Sign-up is not configured yet. Add Firebase keys to .env.local and restart the dev server.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await registerWithEmailPassword(firstName, lastName, email, password);
      setSubmittedEmail(user.email ?? email.trim());
      setSuccessMessage("Account created. We sent a verification link to your inbox—please check spam as well.");
      showWelcomeAfterVerifyClose.current = true;
      setVerifyOpen(true);
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    clearFeedback();
    if (!configured) {
      setNotice("Sign-up is not configured yet. Add Firebase keys to .env.local and restart the dev server.");
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
            Create account
          </h1>

          <form className="mx-auto mt-10 w-full max-w-md space-y-4" onSubmit={handleSubmit} noValidate>
            <input
              name="firstName"
              autoComplete="given-name"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={formLocked}
              className={fieldClass}
            />
            <input
              name="lastName"
              autoComplete="family-name"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={formLocked}
              className={fieldClass}
            />
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
                autoComplete="new-password"
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

            <div className="space-y-3">
              {successMessage ? <AuthSuccessBanner>{successMessage}</AuthSuccessBanner> : null}
              {error ? <AuthErrorBanner>{error}</AuthErrorBanner> : null}
              {notice ? <AuthNoticeBanner>{notice}</AuthNoticeBanner> : null}
            </div>

            <button
              type="submit"
              disabled={formLocked}
              className="mt-2 w-full bg-[var(--lf-purple)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple-deep)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Register now"}
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
            pendingHint="Continuing with Google…"
          />

          <p className="mx-auto mt-10 max-w-md text-center text-sm text-[var(--lf-muted)]">
            Already have an account?{" "}
            <Link href={loginHref} className="font-semibold text-[var(--lf-ink)] underline-offset-2 hover:underline">
              Log in
            </Link>
          </p>

          <p className="mx-auto mt-10 max-w-md text-center text-[11px] leading-relaxed text-[var(--lf-muted)] sm:text-xs">
            By clicking Register now you agree to{" "}
            <Link href="/policies#terms" className="text-[var(--lf-ink)] underline underline-offset-2">
              Terms &amp; conditions
            </Link>{" "}
            and{" "}
            <Link href="/policies#privacy" className="text-[var(--lf-ink)] underline underline-offset-2">
              Privacy policy
            </Link>
            . {site.name} uses your account to secure checkout and keep you updated about orders.
          </p>
        </div>
      </div>

      <VerifyEmailDialog
        email={submittedEmail}
        open={verifyOpen}
        onClose={() => {
          setVerifyOpen(false);
          setSuccessMessage(null);
          if (showWelcomeAfterVerifyClose.current) {
            showWelcomeAfterVerifyClose.current = false;
            setWelcomeOpen(true);
          }
        }}
      />
      <WelcomeAfterSignupDialog
        open={welcomeOpen}
        onClose={() => {
          setWelcomeOpen(false);
          router.replace(afterRegisterPath);
        }}
      />
    </>
  );
}

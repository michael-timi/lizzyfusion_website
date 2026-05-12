"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { firebaseAuthErrorMessage, signInWithGoogle, signOutUser } from "@/lib/firebase-auth";
import { site } from "@/lib/site";

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/**
 * Requires a signed-in Firebase user for all `/checkout/*` routes.
 * Cart and the rest of the site stay public.
 */
export function CheckoutAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useFirebaseAuth();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginHref = `/login?next=${encodeURIComponent(pathname || "/checkout/info")}`;
  const registerHref = `/register?next=${encodeURIComponent(pathname || "/checkout/info")}`;

  if (!configured) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Checkout sign-in unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--lf-muted)]">
          {site.name} checkout needs Firebase configuration (web app keys). Add them to{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">.env.local</code> and restart the dev server.
        </p>
        <Link
          href="/cart"
          className="mt-8 inline-flex border border-[var(--lf-line)] bg-white px-6 py-3 text-sm font-semibold text-[var(--lf-ink)] hover:bg-zinc-50"
        >
          Back to cart
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-[var(--lf-muted)]">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:py-24">
        <h1 className="text-center font-serif text-2xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-3xl">
          Sign in to continue checkout
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-[var(--lf-muted)]">
          For your security, {site.name} asks you to sign in before shipping and payment details. Your bag is saved on this
          device.
        </p>

        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-10 space-y-3">
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setError(null);
              setPending(true);
              try {
                await signInWithGoogle();
              } catch (e) {
                setError(firebaseAuthErrorMessage(e));
              } finally {
                setPending(false);
              }
            }}
            className="flex w-full items-center justify-center gap-3 border border-[var(--lf-line)] bg-white py-3.5 text-sm font-semibold text-[var(--lf-ink)] transition hover:bg-zinc-50 disabled:opacity-60"
          >
            <GoogleMark />
            {pending ? "Opening Google…" : "Continue with Google"}
          </button>

          <p className="text-center text-xs text-[var(--lf-muted)]">
            Or use email:{" "}
            <Link href={loginHref} className="font-semibold text-[var(--lf-ink)] underline-offset-2 hover:underline">
              Log in
            </Link>{" "}
            ·{" "}
            <Link href={registerHref} className="font-semibold text-[var(--lf-ink)] underline-offset-2 hover:underline">
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-10 text-center">
          <Link href="/cart" className="text-sm font-medium text-[var(--lf-muted)] hover:text-[var(--lf-ink)]">
            ← Back to cart
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-[var(--lf-line)] bg-zinc-50/80 px-4 py-2 text-center text-xs text-[var(--lf-muted)] sm:text-left sm:py-2.5">
        <span className="inline-block sm:ml-[max(0px,calc(50vw-36rem))]">
          Signed in as <span className="font-medium text-[var(--lf-ink)]">{user.email ?? user.displayName ?? "member"}</span>
          {" · "}
          <button
            type="button"
            className="font-semibold text-[var(--lf-purple)] underline-offset-2 hover:underline"
            onClick={() => void signOutUser()}
          >
            Sign out
          </button>
        </span>
      </div>
      {children}
    </>
  );
}

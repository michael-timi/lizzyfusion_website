"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { sanitizeNextParam } from "@/lib/auth-redirect";
import { signOutUser } from "@/lib/firebase-auth";

const linkClass = "block rounded-md py-2.5 text-left text-sm transition hover:bg-white/5 hover:text-white";

export function FooterAuthLinks() {
  const pathname = usePathname();
  const { user, loading, isAdmin } = useFirebaseAuth();
  const [signOutPending, setSignOutPending] = useState(false);
  const nextHref = sanitizeNextParam(pathname);
  const loginHref = `/login?next=${encodeURIComponent(nextHref)}`;
  const registerHref = `/register?next=${encodeURIComponent(nextHref)}`;

  if (loading) {
    return (
      <li>
        <span className="text-zinc-500">Checking session…</span>
      </li>
    );
  }

  if (user) {
    return (
      <>
        <li className="max-w-[14rem] truncate">
          <span className="text-zinc-400" title={user.email ?? undefined}>
            Signed in{user.email ? ` · ${user.email}` : ""}
          </span>
        </li>
        {isAdmin ? (
          <li>
            <span className="inline-flex items-center rounded border border-amber-500/50 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
              Admin
            </span>
          </li>
        ) : null}
        <li>
          <button
            type="button"
            className={`w-full rounded-md py-2.5 text-left text-sm transition hover:bg-white/5 hover:text-white disabled:opacity-50`}
            disabled={signOutPending}
            onClick={() => {
              void (async () => {
                setSignOutPending(true);
                try {
                  await signOutUser();
                } finally {
                  setSignOutPending(false);
                }
              })();
            }}
          >
            {signOutPending ? "Signing out…" : "Sign out"}
          </button>
        </li>
      </>
    );
  }

  return (
    <>
      <li>
        <Link href={loginHref} className={linkClass}>
          Log in
        </Link>
      </li>
      <li>
        <Link href={registerHref} className={linkClass}>
          Create account
        </Link>
      </li>
    </>
  );
}

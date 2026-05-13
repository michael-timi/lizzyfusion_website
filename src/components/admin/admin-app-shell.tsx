"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { ADMIN_SECTIONS } from "@/components/admin/admin-nav";
import { getFirebaseDb } from "@/lib/firebase-db";
import { signOutUser } from "@/lib/firebase-auth";
import { site } from "@/lib/site";

function IconMenu({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="text-zinc-700">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function AdminAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, configured, isAdmin, profileLoading } = useFirebaseAuth();
  const [mounted, setMounted] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    startTransition(() => setNavOpen(false));
  }, [pathname]);

  if (!mounted) {
    return (
      <div className="min-h-[50vh] bg-zinc-50 px-4 py-20 text-center text-sm text-zinc-500">
        Loading admin…
      </div>
    );
  }

  if (!configured || !getFirebaseDb()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <h1 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Admin unavailable</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--lf-muted)]">
          Firebase is not configured in this environment. Add your web app keys to{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">.env.local</code> to use the dashboard.
        </p>
        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[var(--lf-purple)] underline">
          Back to storefront
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] bg-zinc-50 px-4 py-20 text-center text-sm text-zinc-500">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <h1 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Sign in required</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--lf-muted)]">
          The studio dashboard is only available to signed-in administrators.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname || "/admin")}`}
          className="mt-8 inline-flex rounded-full bg-[var(--lf-purple)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--lf-purple-deep)]"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-[50vh] bg-zinc-50 px-4 py-20 text-center text-sm text-zinc-500">
        Loading your profile…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <h1 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Access restricted</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--lf-muted)]">
          Signed in as <span className="font-medium text-[var(--lf-ink)]">{user.email}</span>, but this account is
          not marked as an administrator. Promotion happens in the Firebase console: set{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">userType</code> to{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">admin</code> on your{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">users/{`{uid}`}</code> document.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="text-sm font-semibold text-[var(--lf-purple)] underline">
            Back to storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-zinc-100 lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-[130] flex w-[min(18rem,88vw)] flex-col border-r border-zinc-200 bg-white shadow-xl transition-transform duration-200 lg:static lg:z-0 lg:min-h-screen lg:w-56 lg:translate-x-0 lg:shadow-none ${
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4 lg:h-auto lg:flex-col lg:items-stretch lg:gap-0 lg:border-0 lg:p-0">
          <div className="lg:border-b lg:border-zinc-100 lg:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">Admin</p>
            <p className="font-serif text-lg font-semibold text-[var(--lf-ink)]">{site.name}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 lg:hidden"
            aria-label={navOpen ? "Close menu" : "Open menu"}
            onClick={() => setNavOpen((o) => !o)}
          >
            <IconMenu open={navOpen} />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 lg:p-3">
          {ADMIN_SECTIONS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href === "/admin/catalog" &&
                (pathname === "/admin/catalog" || pathname.startsWith("/admin/catalog/edit/"))) ||
              (item.href !== "/admin" &&
                item.href !== "/admin/catalog" &&
                pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-[var(--lf-purple-faint)] font-semibold text-[var(--lf-purple-deep)]"
                    : "text-[var(--lf-ink)] hover:bg-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto hidden border-t border-zinc-100 p-4 lg:block">
          <p className="truncate text-xs text-[var(--lf-muted)]" title={user.email ?? undefined}>
            {user.email}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/" className="text-xs font-semibold text-[var(--lf-purple)] hover:underline">
              View storefront
            </Link>
            <button
              type="button"
              className="text-left text-xs font-semibold text-zinc-500 hover:text-[var(--lf-ink)] disabled:opacity-50"
              disabled={signOutBusy}
              onClick={() => {
                void (async () => {
                  setSignOutBusy(true);
                  try {
                    await signOutUser();
                  } finally {
                    setSignOutBusy(false);
                  }
                })();
              }}
            >
              {signOutBusy ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </aside>

      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[125] bg-black/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-[40] flex h-14 items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md p-2 lg:hidden"
              aria-label="Open admin menu"
              onClick={() => setNavOpen(true)}
            >
              <IconMenu open={false} />
            </button>
            <h1 className="truncate font-serif text-lg font-semibold text-[var(--lf-ink)] sm:text-xl">
              {pathname.startsWith("/admin/catalog/edit/")
                ? "Edit product"
                : ADMIN_SECTIONS.find((s) => {
                    if (pathname === s.href) return true;
                    if (s.href === "/admin" || s.href === "/admin/catalog") return false;
                    return pathname.startsWith(`${s.href}/`);
                  })?.label ?? "Admin"}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs text-[var(--lf-muted)] sm:inline">Administrator</span>
            <Link
              href="/"
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-[var(--lf-ink)] hover:border-[var(--lf-purple)]"
            >
              Storefront
            </Link>
          </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { CartDrawer, useCartItemCount } from "@/components/layout/cart-drawer";
import { useWishlistCount } from "@/components/shop/wishlist-heart";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { sanitizeNextParam } from "@/lib/auth-redirect";
import { signOutUser } from "@/lib/firebase-auth";
import { IconHeart } from "@/components/ui/icon-heart";
import { landingMedia, nav, navStorefront, shopHrefForSpecialty, site } from "@/lib/site";
import { resolveProductImages, useMegaCatalog } from "@/components/layout/use-mega-catalog";

const MegaOccasionsPanel = dynamic(
  () => import("@/components/layout/mega-occasions-panel").then((m) => m.MegaOccasionsPanel),
  { loading: () => <div className="min-h-[12rem] animate-pulse rounded-sm bg-zinc-100" aria-hidden /> },
);

const MegaCraftCarePanel = dynamic(
  () => import("@/components/layout/mega-craft-care-panel").then((m) => m.MegaCraftCarePanel),
  { loading: () => <div className="min-h-[12rem] animate-pulse rounded-sm bg-zinc-100" aria-hidden /> },
);

function IconSearch({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M20 21a8 8 0 1 0-16 0M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 7h12l-1 12H7L6 7Zm3-3h6v4H9V4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const linkClass =
  "block break-words py-1.5 text-sm text-[var(--lf-ink)] transition hover:text-[var(--lf-purple)]";

export function StoreHeaderNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [signOutPending, setSignOutPending] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement | null>(null);
  const cartCount = useCartItemCount();
  const wishlistCount = useWishlistCount();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, configured, isAdmin, profileLoading } = useFirebaseAuth();

  const nextHref = sanitizeNextParam(
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
  );
  const loginHref = `/login?next=${encodeURIComponent(nextHref)}`;
  const registerHref = `/register?next=${encodeURIComponent(nextHref)}`;
  const [query, setQuery] = useState("");

  const [megaOpenId, setMegaOpenId] = useState<string | null>(null);
  const megaCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mobileOpen && !cartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen, cartOpen]);

  useEffect(() => {
    startTransition(() => {
      setMegaOpenId(null);
    });
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    startTransition(() => {
      setMegaOpenId(null);
    });
  }, [searchOpen]);

  useEffect(
    () => () => {
      if (megaCloseTimerRef.current) clearTimeout(megaCloseTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!accountOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = accountWrapRef.current;
      if (el && !el.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const catLinks = site.specialties.slice(0, 8).map((label) => ({
    label,
    href: shopHrefForSpecialty(label),
  }));

  return (
    <>
      {searchOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[40] bg-black/25 backdrop-blur-sm"
          aria-label="Close search"
          onClick={() => setSearchOpen(false)}
        />
      ) : null}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <div
        className="relative z-[50] overflow-visible border-b border-[var(--lf-line)] bg-white"
        onMouseEnter={() => {
          if (megaCloseTimerRef.current) {
            clearTimeout(megaCloseTimerRef.current);
            megaCloseTimerRef.current = null;
          }
        }}
        onMouseLeave={() => {
          megaCloseTimerRef.current = setTimeout(() => {
            setMegaOpenId(null);
            megaCloseTimerRef.current = null;
          }, 150);
        }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="flex items-center gap-3 lg:justify-start">
            <button
              type="button"
              className="flex h-11 min-w-11 items-center justify-center rounded-md text-[var(--lf-ink)] lg:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-drawer"
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu />
            </button>
            <Link
              href="/"
              className="flex min-w-0 flex-col justify-center leading-tight"
            >
              <span className="font-serif text-[1.35rem] font-semibold tracking-tight text-[var(--lf-ink)] sm:text-2xl md:text-[1.65rem]">
                Lizzy Fusion
                <span
                  className="ml-0.5 inline-block h-1.5 w-1.5 translate-y-px rounded-full bg-[var(--lf-purple)]"
                  aria-hidden
                />
              </span>
              <span className="mt-0.5 max-w-[11rem] truncate text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--lf-muted)] sm:max-w-none sm:text-[11px]">
                {site.slogan}
              </span>
            </Link>
          </div>

          <nav
            className={`hidden items-center justify-center gap-8 lg:flex ${searchOpen ? "pointer-events-none opacity-40" : ""}`}
            aria-label="Primary"
          >
            {navStorefront.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onMouseEnter={() => {
                  if (!searchOpen) setMegaOpenId(item.id);
                }}
                className={`inline-flex items-center gap-1 py-2.5 text-sm font-medium transition hover:text-[var(--lf-purple)] md:py-3 ${megaOpenId === item.id ? "text-[var(--lf-purple)]" : "text-[var(--lf-ink)]"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {searchOpen ? (
              <button
                type="button"
                className="flex h-11 min-w-11 items-center justify-center rounded-md text-[var(--lf-ink)] hover:bg-zinc-100"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
              >
                <IconClose />
              </button>
            ) : (
              <button
                type="button"
                className="flex h-11 min-w-11 items-center justify-center rounded-md text-[var(--lf-ink)] hover:bg-zinc-100"
                aria-label="Open search"
                onClick={() => {
                  setSearchOpen(true);
                  const q =
                    pathname === "/shop" ? (searchParams.get("q") ?? "") : "";
                  setQuery(q);
                }}
              >
                <IconSearch />
              </button>
            )}
            {user && isAdmin ? (
              <Link
                href="/admin"
                className="hidden items-center rounded-full border border-amber-800/30 bg-amber-200/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-950 shadow-sm sm:inline-flex"
              >
                Admin
              </Link>
            ) : null}
            <div ref={accountWrapRef} className="relative">
              <button
                type="button"
                className={`relative flex h-11 min-w-11 items-center justify-center rounded-md text-[var(--lf-ink)] hover:bg-zinc-100 ${
                  user && isAdmin
                    ? "text-amber-950 ring-2 ring-amber-500/90 ring-offset-1 ring-offset-white"
                    : user
                      ? "text-[var(--lf-purple)]"
                      : ""
                }`}
                aria-busy={loading || (Boolean(user) && profileLoading)}
                aria-haspopup="menu"
                aria-label={
                  user
                    ? isAdmin
                      ? `Administrator signed in as ${user.email ?? "member"}. Account menu`
                      : `Signed in as ${user.email ?? "member"}. Account menu`
                    : "Account menu"
                }
                onClick={() => setAccountOpen((o) => !o)}
              >
                <IconUser />
                {user && !isAdmin ? (
                  <span
                    className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--lf-purple)] ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
                {user && isAdmin ? (
                  <span
                    className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-600 ring-2 ring-white"
                    aria-hidden
                  />
                ) : null}
              </button>
              {accountOpen ? (
                <div
                  className="absolute right-0 z-[120] mt-1 w-[min(18rem,calc(100vw-2rem))] border border-[var(--lf-line)] bg-white py-2 text-sm shadow-lg"
                  role="menu"
                >
                  {loading ? (
                    <p className="px-3 py-2 text-[var(--lf-muted)]">Checking session…</p>
                  ) : user ? (
                    <>
                      <p className="border-b border-zinc-100 px-3 py-2 text-xs text-[var(--lf-muted)]">Signed in</p>
                      {isAdmin ? (
                        <p className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-amber-950">
                          Administrator
                        </p>
                      ) : null}
                      {isAdmin ? (
                        <Link
                          href="/admin"
                          role="menuitem"
                          className="block border-b border-amber-100 bg-amber-50/80 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
                          onClick={() => setAccountOpen(false)}
                        >
                          Admin dashboard
                        </Link>
                      ) : null}
                      <p className="truncate px-3 py-2 font-medium text-[var(--lf-ink)]" title={user.email ?? undefined}>
                        {user.email ?? user.displayName ?? "Member"}
                      </p>
                      <Link
                        href="/checkout/info"
                        role="menuitem"
                        className="block px-3 py-2 text-[var(--lf-ink)] hover:bg-zinc-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Checkout
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full px-3 py-2 text-left font-semibold text-[var(--lf-purple)] hover:bg-zinc-50 disabled:opacity-50"
                        disabled={signOutPending}
                        onClick={() => {
                          void (async () => {
                            setSignOutPending(true);
                            try {
                              await signOutUser();
                              setAccountOpen(false);
                            } finally {
                              setSignOutPending(false);
                            }
                          })();
                        }}
                      >
                        {signOutPending ? "Signing out…" : "Sign out"}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={loginHref}
                        role="menuitem"
                        className="block px-3 py-2 font-medium text-[var(--lf-ink)] hover:bg-zinc-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        href={registerHref}
                        role="menuitem"
                        className="block px-3 py-2 text-[var(--lf-ink)] hover:bg-zinc-50"
                        onClick={() => setAccountOpen(false)}
                      >
                        Create account
                      </Link>
                    </>
                  )}
                </div>
              ) : null}
            </div>
            <Link
              href="/wishlist"
              className={`relative hidden h-11 min-w-11 items-center justify-center rounded-md sm:inline-flex ${
                wishlistCount > 0
                  ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                  : "text-[var(--lf-ink)] hover:bg-zinc-100"
              }`}
              aria-label={
                wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"
              }
            >
              <IconHeart filled={wishlistCount > 0} />
              {wishlistCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="relative flex h-11 min-w-11 items-center justify-center rounded-md text-[var(--lf-ink)] hover:bg-zinc-100"
              aria-label={cartCount > 0 ? `Shopping bag, ${cartCount} items` : "Open shopping bag"}
              onClick={() => {
                setSearchOpen(false);
                startTransition(() => {
                  setMegaOpenId(null);
                });
                setCartOpen(true);
              }}
            >
              <IconBag />
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--lf-purple-deep)] px-1 text-[10px] font-bold leading-none text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {!searchOpen && megaOpenId ? (
          <div className="absolute inset-x-0 top-full z-[100] -mt-px border-t border-[var(--lf-line)] bg-white shadow-[0_24px_48px_-12px_rgba(0,0,0,0.12)]">
            <div className="mx-auto max-h-[min(92dvh,calc(100dvh-3rem))] w-full min-h-0 max-w-[1400px] overflow-auto bg-white px-4 py-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] sm:px-6 sm:py-10">
              <MegaPanelContents megaId={megaOpenId} catLinks={catLinks} />
            </div>
          </div>
        ) : null}

        {searchOpen ? (
          <div className="border-t border-[var(--lf-line)] bg-white px-4 py-3 sm:px-6">
            <form
              className="mx-auto flex max-w-[1400px] items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const q = query.trim();
                router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
                setSearchOpen(false);
              }}
            >
              <IconSearch className="shrink-0 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search catalogue…"
                className="min-w-0 flex-1 border-0 border-b border-zinc-200 bg-transparent py-2 text-base text-[var(--lf-ink)] outline-none placeholder:text-zinc-400 focus:border-[var(--lf-purple)]"
                aria-label="Search"
                autoFocus
              />
              {query ? (
                <button
                  type="button"
                  className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-[var(--lf-ink)]"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <IconClose />
                </button>
              ) : null}
            </form>
          </div>
        ) : null}

        {mobileOpen ? (
          <div
            className="fixed inset-0 z-[60] flex lg:hidden"
            id="mobile-drawer"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative ml-auto flex h-full w-[min(100%,22rem)] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--lf-line)] px-4 py-3">
                <span className="font-serif text-lg font-semibold">
                  {site.name}
                </span>
                <button
                  type="button"
                  className="flex h-11 min-w-11 items-center justify-center rounded-md text-[var(--lf-ink)]"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close"
                >
                  <IconClose />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Shop
                </p>
                {navStorefront.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block border-b border-zinc-100 py-3 text-sm font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/wishlist"
                  className={`block border-b border-zinc-100 py-3 text-sm font-medium ${
                    wishlistCount > 0 ? "text-red-600" : ""
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  Wish list{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                </Link>
                <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Account
                </p>
                {loading ? (
                  <p className="border-b border-zinc-100 py-3 text-sm text-[var(--lf-muted)]">Checking session…</p>
                ) : !configured ? (
                  <p className="border-b border-zinc-100 py-3 text-sm text-[var(--lf-muted)]">
                    Sign-in is not configured on this build.
                  </p>
                ) : user ? (
                  <>
                    <p className="border-b border-zinc-100 py-2 text-xs text-[var(--lf-muted)]">Signed in</p>
                    {isAdmin ? (
                      <p className="border-b border-amber-200 bg-amber-50 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-amber-950">
                        Administrator
                      </p>
                    ) : null}
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        className="block border-b border-amber-100 bg-amber-50/80 py-3 text-center text-sm font-semibold text-amber-950 hover:bg-amber-100"
                        onClick={() => setMobileOpen(false)}
                      >
                        Admin dashboard
                      </Link>
                    ) : null}
                    <p className="truncate border-b border-zinc-100 py-2 text-sm font-medium text-[var(--lf-ink)]">
                      {user.email ?? user.displayName ?? "Member"}
                    </p>
                    <Link
                      href="/checkout/info"
                      className="block border-b border-zinc-100 py-3 text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Checkout
                    </Link>
                    <button
                      type="button"
                      className="block w-full border-b border-zinc-100 py-3 text-left text-sm font-semibold text-[var(--lf-purple)] disabled:opacity-50"
                      disabled={signOutPending}
                      onClick={() => {
                        void (async () => {
                          setSignOutPending(true);
                          try {
                            await signOutUser();
                            setMobileOpen(false);
                          } finally {
                            setSignOutPending(false);
                          }
                        })();
                      }}
                    >
                      {signOutPending ? "Signing out…" : "Sign out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={loginHref}
                      className="block border-b border-zinc-100 py-3 text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href={registerHref}
                      className="block border-b border-zinc-100 py-3 text-sm font-medium"
                      onClick={() => setMobileOpen(false)}
                    >
                      Create account
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  className="block w-full border-b border-zinc-100 py-3 text-left text-sm font-medium"
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(false);
                    startTransition(() => setMegaOpenId(null));
                    setCartOpen(true);
                  }}
                >
                  Shopping bag{cartCount > 0 ? ` (${cartCount})` : ""}
                </button>
                <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Studio
                </p>
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block border-b border-zinc-100 py-3 text-sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  className="mt-4 w-full border border-[var(--lf-line)] py-3 text-left text-sm font-semibold text-[var(--lf-purple)]"
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                    setQuery(
                      pathname === "/shop" ? (searchParams.get("q") ?? "") : "",
                    );
                    router.push("/shop");
                  }}
                >
                  Search catalogue
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function MegaPanelContents({
  megaId,
  catLinks,
}: {
  megaId: string;
  catLinks: { label: string; href: string }[];
}) {
  const catalog = useMegaCatalog();
  const collectionImages = resolveProductImages(catalog, [
    { keywords: landingMedia.collectionTiles[0].keywords, fallback: landingMedia.collectionTiles[0].image },
    { keywords: ["aso-ebi"], fallback: landingMedia.collectionTiles[1].image },
  ]);
  const newInImages = resolveProductImages(catalog, [
    { keywords: landingMedia.lookbook[1].shopKeywords[0], fallback: landingMedia.lookbook[1].image },
    { keywords: landingMedia.lookbook[2].shopKeywords[0], fallback: landingMedia.lookbook[2].image },
  ]);
  const lookbookImages = resolveProductImages(
    catalog,
    landingMedia.lookbook.map((d) => ({ keywords: d.shopKeywords[0], fallback: d.image })),
  );
  return (
    <>
      {megaId === "collection" ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,10rem)_minmax(0,10rem)] lg:gap-10">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Category
                </p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <Link href="/shop" className={linkClass}>
                      Shop all
                    </Link>
                  </li>
                  {catLinks.map((c) => (
                    <li key={c.label}>
                      <Link href={c.href} className={linkClass}>
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Featured
                </p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <Link href="/shop#best-sellers" className={linkClass}>
                      New arrivals
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop#best-sellers" className={linkClass}>
                      Best sellers
                    </Link>
                  </li>
                  <li>
                    <Link href="/custom" className={linkClass}>
                      Custom desk
                    </Link>
                  </li>
                  <li>
                    <Link href="/training" className={linkClass}>
                      In-person training
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  More
                </p>
                <ul className="mt-4 space-y-1">
                  <li>
                    <Link href="/apprentice" className={linkClass}>
                      Apprentice hub
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className={linkClass}>
                      Our story
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className={linkClass}>
                      Book a fitting
                    </Link>
                  </li>
                </ul>
              </div>
              <MegaImageCard
                href={shopHrefForSpecialty(landingMedia.collectionTiles[0].label)}
                label={landingMedia.collectionTiles[0].label}
                src={collectionImages[0]}
              />
              <MegaImageCard
                href={shopHrefForSpecialty("Aso-ebi")}
                label="Aso-ebi & groups"
                src={collectionImages[1]}
              />
            </div>
          ) : null}
      {megaId === "new-in" ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,14rem)_minmax(0,14rem)]">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  New in Osogbo
                </p>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--lf-muted)]">
                  Latest ready-to-wear drops and made-to-order slots. Prices in
                  naira—confirm availability on WhatsApp after you enquire from
                  the shop.
                </p>
                <Link
                  href="/shop#best-sellers"
                  className="mt-6 inline-block text-sm font-semibold text-[var(--lf-purple)] underline-offset-4 hover:underline"
                >
                  View best sellers
                </Link>
              </div>
              <MegaImageCard
                href={landingMedia.lookbook[1].href}
                label={landingMedia.lookbook[1].label}
                src={newInImages[0]}
              />
              <MegaImageCard
                href={landingMedia.lookbook[2].href}
                label={landingMedia.lookbook[2].label}
                src={newInImages[1]}
              />
            </div>
          ) : null}
      {megaId === "lookbook" ? (
            <div className="grid gap-8 lg:grid-cols-4">
              {landingMedia.lookbook.map((d, i) => (
                <Link
                  key={d.label}
                  href={d.href}
                  className="group/card block min-w-0"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                    <LfRemoteImage
                      src={lookbookImages[i]}
                      alt=""
                      fill
                      className="object-cover transition duration-500 group-hover/card:scale-105"
                      sizes="200px"
                    />
                  </div>
                  <p className="mt-3 break-words text-sm font-semibold leading-snug">{d.label}</p>
                  <p className="text-xs break-words text-[var(--lf-muted)]">{d.caption}</p>
                </Link>
              ))}
            </div>
          ) : null}
      {megaId === "occasions" ? <MegaOccasionsPanel /> : null}
      {megaId === "sustainability" ? <MegaCraftCarePanel /> : null}
    </>
  );
}

function MegaImageCard({
  href,
  label,
  src,
}: {
  href: string;
  label: string;
  src: string;
}) {
  return (
    <Link href={href} className="group/img block min-w-0">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-100">
        <LfRemoteImage
          src={src}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover/img:scale-105"
          sizes="180px"
        />
      </div>
      <p className="mt-3 break-words text-sm font-medium leading-snug">{label}</p>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  clearCart,
  getCartLinesJson,
  parseStoredCart,
  removeCartLine,
  subscribeCartStore,
  updateCartQty,
} from "@/lib/cart";
import { formatNgn, getSampleProductBySlug, navStorefront, site, whatsappHref } from "@/lib/site";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";

function IconClose({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const emptyNavLinks = [
  { label: "Collection", href: navStorefront.find((n) => n.id === "collection")?.href ?? "/shop" },
  { label: "New In", href: navStorefront.find((n) => n.id === "new-in")?.href ?? "/shop#best-sellers" },
  { label: "Best sellers", href: "/shop#best-sellers" },
] as const;

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const raw = useSyncExternalStore(subscribeCartStore, getCartLinesJson, () => "[]");
  const lines = useMemo(() => parseStoredCart(raw), [raw]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const checkoutHref = useMemo(() => {
    if (lines.length === 0) return "#";
    const parts: string[] = [`*${site.name} — bag checkout*`];
    let subtotal = 0;
    for (const line of lines) {
      const p = getSampleProductBySlug(line.slug);
      if (!p) continue;
      const lineTotal = p.price * line.qty;
      subtotal += lineTotal;
      parts.push(
        `• ${p.name} ×${line.qty} · ${line.size} · ${line.color} — ${formatNgn(lineTotal)}`,
      );
    }
    parts.push("", `Subtotal: ${formatNgn(subtotal)}`, "", "Please confirm availability and next steps.");
    return whatsappHref(parts.join("\n"));
  }, [lines]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[105] bg-black/40 backdrop-blur-sm transition-opacity"
        aria-label="Close shopping bag"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-[110] flex w-[min(100%,22rem)] flex-col bg-white shadow-2xl sm:w-[min(100%,26rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div className="relative flex shrink-0 items-center justify-center border-b border-[var(--lf-line)] px-4 py-4">
          <h2 id="cart-drawer-title" className="text-center text-base font-semibold text-[var(--lf-ink)]">
            Your cart
          </h2>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-[var(--lf-ink)] hover:bg-zinc-100"
            onClick={onClose}
            aria-label="Close cart"
          >
            <IconClose />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-lg font-semibold text-[var(--lf-ink)]">Your shopping bag is empty</p>
            <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-[var(--lf-muted)]">
              Discover {site.name} and add pieces to your bag—enquiry and checkout still finish on WhatsApp.
            </p>
            <nav className="mt-10 flex w-full max-w-[14rem] flex-col gap-3" aria-label="Shop categories">
              {emptyNavLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className="w-full border border-transparent bg-[var(--lf-purple-deep)] py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : (
          <>
            <ul className="min-h-0 flex-1 divide-y divide-[var(--lf-line)] overflow-y-auto overscroll-contain px-4 py-2">
              {lines.map((line) => {
                const p = getSampleProductBySlug(line.slug);
                if (!p) return null;
                const linePrice = p.price * line.qty;
                return (
                  <li key={line.id} className="flex items-stretch gap-3 py-4">
                    <div className="relative w-16 shrink-0 self-stretch min-h-[5rem] sm:w-[4.5rem]">
                      <Link
                        href={`/shop/${p.slug}`}
                        onClick={onClose}
                        className="absolute inset-0 block overflow-hidden bg-zinc-100"
                      >
                        <LfRemoteImage src={p.image} alt="" fill className="object-cover" sizes="72px" />
                      </Link>
                    </div>
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/shop/${p.slug}`}
                          onClick={onClose}
                          className="text-sm font-semibold text-[var(--lf-ink)] hover:text-[var(--lf-purple-deep)]"
                        >
                          {p.name}
                        </Link>
                        <button
                          type="button"
                          className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-[var(--lf-ink)]"
                          aria-label={`Remove ${p.name}`}
                          onClick={() => removeCartLine(line.id)}
                        >
                          <IconClose className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-[var(--lf-muted)]">Size {line.size}</p>
                      <p className="text-xs text-[var(--lf-muted)]">Color {line.color}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center border border-[var(--lf-line)] bg-zinc-50">
                          <button
                            type="button"
                            className="px-2.5 py-1 text-sm text-[var(--lf-ink)] transition hover:bg-zinc-200"
                            aria-label="Decrease quantity"
                            onClick={() => updateCartQty(line.id, line.qty - 1)}
                          >
                            −
                          </button>
                          <span className="min-w-[2rem] px-1 text-center text-sm font-medium tabular-nums">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            className="px-2.5 py-1 text-sm text-[var(--lf-ink)] transition hover:bg-zinc-200"
                            aria-label="Increase quantity"
                            onClick={() => updateCartQty(line.id, line.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-[var(--lf-ink)]">{formatNgn(linePrice)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="shrink-0 space-y-2 border-t border-[var(--lf-line)] bg-white p-4">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex w-full items-center justify-center border border-[var(--lf-ink)] bg-white py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
              >
                View full cart &amp; checkout
              </Link>
              <a
                href={checkoutHref}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center bg-[var(--lf-purple-deep)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
              >
                Check out on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                }}
                className="mt-3 w-full text-center text-xs font-medium text-[var(--lf-muted)] underline-offset-2 hover:text-[var(--lf-ink)] hover:underline"
              >
                Clear bag
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export function useCartItemCount(): number {
  const raw = useSyncExternalStore(subscribeCartStore, getCartLinesJson, () => "[]");
  return useMemo(() => parseStoredCart(raw).reduce((n, l) => n + l.qty, 0), [raw]);
}

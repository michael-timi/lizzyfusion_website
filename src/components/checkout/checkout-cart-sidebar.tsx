"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { getCartLinesJson, parseStoredCart, removeCartLine, subscribeCartStore, updateCartQty } from "@/lib/cart";
import { checkoutTotals } from "@/lib/checkout-totals";
import { formatNgn, getSampleProductBySlug, site } from "@/lib/site";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";

function IconClose({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CheckoutCartSidebar() {
  const raw = useSyncExternalStore(subscribeCartStore, getCartLinesJson, () => "[]");
  const lines = useMemo(() => parseStoredCart(raw), [raw]);
  const totals = useMemo(() => checkoutTotals(lines), [lines]);

  return (
    <aside className="border border-[var(--lf-line)] bg-zinc-100 p-6 lg:sticky lg:top-24 lg:self-start lg:p-8">
      <h2 className="text-center text-base font-semibold text-[var(--lf-ink)]">Your cart</h2>

      {lines.length === 0 ? (
        <p className="mt-6 text-center text-sm text-[var(--lf-muted)]">Your bag is empty.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {lines.map((line) => {
            const p = getSampleProductBySlug(line.slug);
            if (!p) return null;
            const lineTotal = p.price * line.qty;
            return (
              <li key={line.id} className="flex items-stretch gap-3">
                <div className="relative w-16 shrink-0 self-stretch min-h-[5rem] sm:w-[4.5rem]">
                  <Link
                    href={`/shop/${p.slug}`}
                    className="absolute inset-0 block overflow-hidden bg-white"
                  >
                    <LfRemoteImage src={p.image} alt="" fill className="object-cover" sizes="72px" />
                  </Link>
                  <span className="pointer-events-none absolute right-1 top-1 bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[var(--lf-ink)] shadow-sm">
                    {line.qty}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--lf-ink)]">{p.name}</p>
                    <button
                      type="button"
                      className="shrink-0 text-zinc-400 hover:text-[var(--lf-ink)]"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => removeCartLine(line.id)}
                    >
                      <IconClose />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[var(--lf-muted)]">Size {line.size}</p>
                  <p className="text-xs text-[var(--lf-muted)]">Color {line.color}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center border border-[var(--lf-line)] bg-white text-sm">
                      <button
                        type="button"
                        className="px-2 py-1 text-[var(--lf-ink)] hover:bg-zinc-100"
                        aria-label="Decrease"
                        onClick={() => updateCartQty(line.id, line.qty - 1)}
                      >
                        −
                      </button>
                      <span className="min-w-8 px-1 text-center tabular-nums">{line.qty}</span>
                      <button
                        type="button"
                        className="px-2 py-1 text-[var(--lf-ink)] hover:bg-zinc-100"
                        aria-label="Increase"
                        onClick={() => updateCartQty(line.id, line.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-[var(--lf-ink)]">{formatNgn(lineTotal)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 space-y-2 border-t border-zinc-200 pt-4 text-sm">
        <div className="flex justify-between text-[var(--lf-muted)]">
          <span>Subtotal ({totals.count})</span>
          <span className="font-medium text-[var(--lf-ink)]">{formatNgn(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-[var(--lf-muted)]">
          <span>Tax (est.)</span>
          <span className="font-medium text-[var(--lf-ink)]">{formatNgn(totals.tax)}</span>
        </div>
        <div className="flex justify-between text-[var(--lf-muted)]">
          <span>Shipping</span>
          <span className="font-medium text-[var(--lf-ink)]">{totals.shipping === 0 ? "Free" : formatNgn(totals.shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold text-[var(--lf-ink)]">
          <span>Total</span>
          <span>{formatNgn(totals.total)}</span>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-[var(--lf-muted)]">
        The total shown is for planning only—{site.name} confirms duties, taxes, and courier fees on WhatsApp before
        you pay.
      </p>
    </aside>
  );
}

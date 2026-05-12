"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
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

export function CartPageView() {
  const raw = useSyncExternalStore(subscribeCartStore, getCartLinesJson, () => "[]");
  const lines = useMemo(() => parseStoredCart(raw), [raw]);
  const totals = useMemo(() => checkoutTotals(lines), [lines]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <Link href="/" className="font-serif text-xl font-semibold text-[var(--lf-ink)] sm:text-2xl">
        {site.name}
      </Link>
      <div className="mt-4">
        <CheckoutSteps active="cart" />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link href="/shop" className="text-sm font-medium text-[var(--lf-muted)] hover:text-[var(--lf-ink)]">
          ← Back
        </Link>
        <Link
          href="/shop"
          className="text-sm font-medium text-[var(--lf-muted)] hover:text-[var(--lf-purple)] hover:underline"
        >
          Continue shopping
        </Link>
      </div>

      <h1 className="mt-6 font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">
        Your cart
      </h1>

      {lines.length === 0 ? (
        <div className="mt-12 rounded-lg border border-dashed border-[var(--lf-line)] bg-zinc-50 px-8 py-16 text-center">
          <p className="text-lg font-semibold text-[var(--lf-ink)]">Your shopping bag is empty</p>
          <p className="mt-2 text-sm text-[var(--lf-muted)]">
            Discover {site.name} and add pieces from the shop—checkout still runs on WhatsApp when you are ready.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex border border-[var(--lf-purple-deep)] bg-[var(--lf-purple-deep)] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
          >
            Browse shop
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-10 hidden md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--lf-line)] text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  <th className="pb-3 pr-4 font-medium">Order summary</th>
                  <th className="w-28 pb-3 pr-4 text-right font-medium">Price</th>
                  <th className="w-36 pb-3 pr-4 text-center font-medium">Quantity</th>
                  <th className="w-28 pb-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const p = getSampleProductBySlug(line.slug);
                  if (!p) return null;
                  const unit = p.price;
                  const lineTotal = unit * line.qty;
                  return (
                    <tr key={line.id} className="border-b border-[var(--lf-line)] align-top">
                      <td className="py-5 pr-4">
                        <div className="flex items-stretch gap-4">
                          <div className="relative w-20 shrink-0 self-stretch min-h-[5.5rem] sm:w-24">
                            <Link href={`/shop/${p.slug}`} className="absolute inset-0 block overflow-hidden bg-zinc-100">
                              <LfRemoteImage src={p.image} alt="" fill className="object-cover" sizes="96px" />
                            </Link>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                            <div>
                              <p className="font-semibold text-[var(--lf-ink)]">{p.name}</p>
                              <p className="mt-1 text-xs text-[var(--lf-muted)]">Size: {line.size}</p>
                              <p className="text-xs text-[var(--lf-muted)]">Color: {line.color}</p>
                            </div>
                            <button
                              type="button"
                              className="mt-3 flex w-max items-center gap-1 text-xs text-zinc-400 hover:text-[var(--lf-ink)]"
                              onClick={() => removeCartLine(line.id)}
                            >
                              <IconClose className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 pr-4 text-right font-medium tabular-nums text-[var(--lf-ink)]">
                        {formatNgn(unit)}
                      </td>
                      <td className="py-5 pr-4">
                        <div className="mx-auto flex w-max items-center border border-[var(--lf-line)] bg-zinc-50">
                          <button
                            type="button"
                            className="px-3 py-1.5 text-[var(--lf-ink)] hover:bg-zinc-200"
                            aria-label="Decrease quantity"
                            onClick={() => updateCartQty(line.id, line.qty - 1)}
                          >
                            −
                          </button>
                          <span className="min-w-10 px-2 text-center tabular-nums">{line.qty}</span>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-[var(--lf-ink)] hover:bg-zinc-200"
                            aria-label="Increase quantity"
                            onClick={() => updateCartQty(line.id, line.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-5 text-right font-semibold tabular-nums text-[var(--lf-ink)]">
                        {formatNgn(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="mt-8 divide-y divide-[var(--lf-line)] md:hidden">
            {lines.map((line) => {
              const p = getSampleProductBySlug(line.slug);
              if (!p) return null;
              const lineTotal = p.price * line.qty;
              return (
                <li key={line.id} className="flex gap-3 py-5">
                  <div className="relative w-20 shrink-0 self-stretch min-h-[5.5rem]">
                    <Link href={`/shop/${p.slug}`} className="absolute inset-0 block overflow-hidden bg-zinc-100">
                      <LfRemoteImage src={p.image} alt="" fill className="object-cover" sizes="80px" />
                    </Link>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold text-[var(--lf-ink)]">{p.name}</p>
                      <button type="button" className="text-zinc-400" aria-label="Remove" onClick={() => removeCartLine(line.id)}>
                        <IconClose />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-[var(--lf-muted)]">Size {line.size}</p>
                    <p className="text-xs text-[var(--lf-muted)]">Color {line.color}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex border border-[var(--lf-line)] bg-zinc-50 text-sm">
                        <button type="button" className="px-2 py-1" onClick={() => updateCartQty(line.id, line.qty - 1)}>
                          −
                        </button>
                        <span className="min-w-8 px-2 py-1 text-center tabular-nums">{line.qty}</span>
                        <button type="button" className="px-2 py-1" onClick={() => updateCartQty(line.id, line.qty + 1)}>
                          +
                        </button>
                      </div>
                      <p className="font-semibold tabular-nums">{formatNgn(lineTotal)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex flex-col items-end gap-3 border-t border-[var(--lf-line)] pt-8 text-sm">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-[var(--lf-muted)]">
                <span>Subtotal ({totals.count})</span>
                <span className="font-medium tabular-nums text-[var(--lf-ink)]">{formatNgn(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--lf-muted)]">
                <span>Tax (est.)</span>
                <span className="font-medium tabular-nums text-[var(--lf-ink)]">{formatNgn(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-[var(--lf-muted)]">
                <span>Shipping</span>
                <span className="font-medium text-[var(--lf-ink)]">Free</span>
              </div>
              <div className="flex justify-between border-t border-[var(--lf-line)] pt-2 text-base font-semibold text-[var(--lf-ink)]">
                <span>Total</span>
                <span className="tabular-nums">{formatNgn(totals.total)}</span>
              </div>
            </div>
            <p className="max-w-md text-right text-[11px] leading-relaxed text-[var(--lf-muted)]">
              The total amount is an estimate—{site.name} confirms duties, taxes, and courier fees on WhatsApp before you
              pay.
            </p>
            <Link
              href="/checkout/info"
              className="mt-2 inline-flex min-w-[12rem] justify-center border border-[var(--lf-purple-deep)] bg-[var(--lf-purple-deep)] px-10 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
            >
              Next
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

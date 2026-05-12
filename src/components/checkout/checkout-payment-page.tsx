"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { clearCart, getCartLinesJson, parseStoredCart, subscribeCartStore } from "@/lib/cart";
import { buildOrderSnapshot, persistOrderSnapshot } from "@/lib/checkout-order-snapshot";
import { checkoutTotals } from "@/lib/checkout-totals";
import { CheckoutCartGate } from "@/components/checkout/checkout-cart-gate";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { useCheckoutForm } from "@/components/checkout/checkout-context";
import { formatNgn, getSampleProductBySlug, site, whatsappHref } from "@/lib/site";

const input =
  "mt-1.5 w-full border border-[var(--lf-line)] bg-white px-3 py-2.5 text-sm text-[var(--lf-ink)] outline-none transition focus:border-[var(--lf-purple)]";

export function CheckoutPaymentPage() {
  const router = useRouter();
  const { form, patchForm } = useCheckoutForm();
  const raw = useSyncExternalStore(subscribeCartStore, getCartLinesJson, () => "[]");
  const lines = useMemo(() => parseStoredCart(raw), [raw]);
  const totals = useMemo(() => checkoutTotals(lines), [lines]);

  const payHref = useMemo(() => {
    if (lines.length === 0) return "#";
    const parts: string[] = [
      `*${site.name} — place order*`,
      "",
      `Contact: ${form.email}`,
      `Phone: ${form.phone}`,
      "",
      "Ship to:",
      `${form.firstName} ${form.lastName}`,
      form.company ? `${form.company}` : "",
      `${form.address}${form.apartment ? `, ${form.apartment}` : ""}`,
      `${form.city} ${form.postal}`,
      form.country,
      "",
      `Delivery: ${form.shippingMethod} · ${form.deliveryDate || "Date TBC"}`,
      "",
      "Items:",
    ];
    for (const line of lines) {
      const p = getSampleProductBySlug(line.slug);
      if (!p) continue;
      parts.push(`• ${p.name} ×${line.qty} · ${line.size} · ${line.color} — ${formatNgn(p.price * line.qty)}`);
    }
    parts.push(
      "",
      `Subtotal: ${formatNgn(totals.subtotal)}`,
      `Tax (est.): ${formatNgn(totals.tax)}`,
      `Total: ${formatNgn(totals.total)}`,
      "",
      "Billing:",
      form.sameBilling
        ? "Same as shipping address."
        : `${form.billingName}, ${form.billingAddress1}, ${form.billingCity} ${form.billingPostal}, ${form.billingCountry}. ${form.billingEmail} · ${form.billingPhone}`,
      "",
      "We do not store card numbers on this demo checkout—please confirm payment on WhatsApp.",
    );
    return whatsappHref(parts.filter(Boolean).join("\n"));
  }, [form, lines, totals]);

  return (
    <CheckoutCartGate>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <Link href="/" className="font-serif text-xl font-semibold text-[var(--lf-ink)]">
          {site.name}
        </Link>
        <div className="mt-4">
          <CheckoutSteps active="payment" />
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold text-[var(--lf-ink)]">Billing address</h2>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[var(--lf-ink)]">
              <input
                type="checkbox"
                checked={form.sameBilling}
                onChange={(e) => patchForm({ sameBilling: e.target.checked })}
                className="accent-[var(--lf-purple)]"
              />
              Same as shipping address
            </label>

            {!form.sameBilling ? (
              <div className="mt-6 grid gap-4">
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  Full name
                  <input
                    type="text"
                    value={form.billingName}
                    onChange={(e) => patchForm({ billingName: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  Email
                  <input
                    type="email"
                    value={form.billingEmail}
                    onChange={(e) => patchForm({ billingEmail: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  Country
                  <input
                    type="text"
                    value={form.billingCountry}
                    onChange={(e) => patchForm({ billingCountry: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  Address line 1
                  <input
                    type="text"
                    value={form.billingAddress1}
                    onChange={(e) => patchForm({ billingAddress1: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  Address line 2
                  <input
                    type="text"
                    value={form.billingAddress2}
                    onChange={(e) => patchForm({ billingAddress2: e.target.value })}
                    className={input}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-[var(--lf-ink)]">
                    City
                    <input
                      type="text"
                      value={form.billingCity}
                      onChange={(e) => patchForm({ billingCity: e.target.value })}
                      className={input}
                    />
                  </label>
                  <label className="block text-sm font-medium text-[var(--lf-ink)]">
                    Postal code
                    <input
                      type="text"
                      value={form.billingPostal}
                      onChange={(e) => patchForm({ billingPostal: e.target.value })}
                      className={input}
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  Phone
                  <input
                    type="tel"
                    value={form.billingPhone}
                    onChange={(e) => patchForm({ billingPhone: e.target.value })}
                    className={input}
                  />
                </label>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--lf-muted)]">
                We will use your shipping address for billing documents unless you add an alternative above.
              </p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--lf-ink)]">Payment</h2>
            <p className="mt-2 text-sm text-[var(--lf-muted)]">Choose how you would like to pay—the studio confirms on WhatsApp.</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Card (optional — not charged here)</p>
            <label className="mt-2 block text-sm font-medium text-[var(--lf-ink)]">
              Card number
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0000 0000 0000 0000"
                value={form.cardNumber}
                onChange={(e) => patchForm({ cardNumber: e.target.value })}
                className={input}
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-[var(--lf-ink)]">
                Month
                <input
                  type="text"
                  placeholder="MM"
                  value={form.cardMonth}
                  onChange={(e) => patchForm({ cardMonth: e.target.value })}
                  className={input}
                />
              </label>
              <label className="block text-sm font-medium text-[var(--lf-ink)]">
                Year
                <input
                  type="text"
                  placeholder="YY"
                  value={form.cardYear}
                  onChange={(e) => patchForm({ cardYear: e.target.value })}
                  className={input}
                />
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium text-[var(--lf-ink)]">
              Security code
              <input
                type="text"
                inputMode="numeric"
                placeholder="CVV"
                value={form.cardCvv}
                onChange={(e) => patchForm({ cardCvv: e.target.value })}
                className={input}
              />
            </label>

            <div className="mt-8 rounded border border-[var(--lf-line)] bg-zinc-50 p-4 text-sm">
              <div className="flex justify-between text-[var(--lf-muted)]">
                <span>Subtotal ({totals.count})</span>
                <span className="font-medium text-[var(--lf-ink)]">{formatNgn(totals.subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-[var(--lf-muted)]">
                <span>Tax (est.)</span>
                <span className="font-medium text-[var(--lf-ink)]">{formatNgn(totals.tax)}</span>
              </div>
              <div className="mt-2 flex justify-between font-semibold text-[var(--lf-ink)]">
                <span>Total</span>
                <span>{formatNgn(totals.total)}</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 flex w-full items-center justify-center border border-[var(--lf-purple-deep)] bg-[var(--lf-purple-deep)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
              onClick={() => {
                if (lines.length === 0 || payHref === "#") return;
                const snap = buildOrderSnapshot(lines, form, totals);
                if (snap) persistOrderSnapshot(snap);
                clearCart();
                window.open(payHref, "_blank", "noopener,noreferrer");
                router.push("/checkout/success");
              }}
            >
              Pay and place order on WhatsApp
            </button>
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--lf-muted)]">
              This page does not process cards. Tapping the button opens WhatsApp with your order summary; the team will
              confirm payment and production slots with you.
            </p>
            <p className="mt-4 text-center text-sm text-[var(--lf-muted)]">
              <Link
                href="/checkout/failure"
                className="font-medium text-[var(--lf-purple-deep)] underline-offset-2 hover:underline"
              >
                Payment could not complete?
              </Link>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-[var(--lf-line)] pt-8">
          <Link href="/checkout/shipping" className="text-sm font-medium text-[var(--lf-muted)] hover:text-[var(--lf-ink)]">
            ← Return to shipping
          </Link>
        </div>
      </div>
    </CheckoutCartGate>
  );
}

"use client";

import Link from "next/link";
import { CheckoutCartGate } from "@/components/checkout/checkout-cart-gate";
import { CheckoutCartSidebar } from "@/components/checkout/checkout-cart-sidebar";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { useCheckoutForm } from "@/components/checkout/checkout-context";
import { site } from "@/lib/site";

const dates = ["Mon 18 Aug", "Tue 19 Aug", "Wed 20 Aug", "Thu 21 Aug"] as const;

export function CheckoutShippingPage() {
  const { form, patchForm } = useCheckoutForm();

  return (
    <CheckoutCartGate>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <Link href="/" className="font-serif text-xl font-semibold text-[var(--lf-ink)]">
          {site.name}
        </Link>
        <div className="mt-4">
          <CheckoutSteps active="shipping" />
        </div>

        <div className="mt-8 grid gap-6 text-sm text-[var(--lf-muted)] sm:grid-cols-2">
          <div className="flex justify-between border-b border-[var(--lf-line)] pb-3">
            <span>Contact</span>
            <span className="text-right font-medium text-[var(--lf-ink)]">{form.email || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-[var(--lf-line)] pb-3 sm:text-right">
            <span>Ship to</span>
            <span className="max-w-[14rem] text-right font-medium text-[var(--lf-ink)]">
              {[form.firstName, form.lastName, form.address, form.city].filter(Boolean).join(", ") || "—"}
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:gap-12">
          <section className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--lf-ink)]">Delivery options</h2>
            <div className="mt-4 space-y-3 rounded border border-[var(--lf-line)] bg-zinc-50/50 p-4">
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <span>
                  <input
                    type="radio"
                    name="ship"
                    checked={form.shippingMethod === "standard"}
                    onChange={() => patchForm({ shippingMethod: "standard" })}
                    className="mt-1 accent-[var(--lf-purple)]"
                  />
                  <span className="ml-2 font-medium text-[var(--lf-ink)]">Standard courier</span>
                  <span className="mt-1 block text-xs text-[var(--lf-muted)]">3–5 business days within Nigeria (estimate)</span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--lf-ink)]">Free</span>
              </label>
              <label className="flex cursor-pointer items-start justify-between gap-4 border-t border-[var(--lf-line)] pt-3">
                <span>
                  <input
                    type="radio"
                    name="ship"
                    checked={form.shippingMethod === "express"}
                    onChange={() => patchForm({ shippingMethod: "express" })}
                    className="mt-1 accent-[var(--lf-purple)]"
                  />
                  <span className="ml-2 font-medium text-[var(--lf-ink)]">Express (when offered)</span>
                  <span className="mt-1 block text-xs text-[var(--lf-muted)]">Quoted on WhatsApp for your city</span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--lf-ink)]">—</span>
              </label>
            </div>

            <p className="mt-6 text-sm font-semibold text-[var(--lf-ink)]">Preferred delivery week</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {dates.map((d) => (
                <label
                  key={d}
                  className={`flex cursor-pointer items-center justify-center border px-2 py-2 text-center text-xs ${
                    form.deliveryDate === d
                      ? "border-[var(--lf-purple-deep)] bg-[var(--lf-purple-faint)]"
                      : "border-[var(--lf-line)] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="del"
                    className="sr-only"
                    checked={form.deliveryDate === d}
                    onChange={() => patchForm({ deliveryDate: d })}
                  />
                  {d}
                </label>
              ))}
            </div>
          </section>

          <CheckoutCartSidebar />
        </div>

        <div className="mt-12 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-[var(--lf-line)] pt-8 sm:flex-row sm:items-center">
          <Link href="/checkout/info" className="text-sm font-medium text-[var(--lf-muted)] hover:text-[var(--lf-ink)]">
            ← Return to information
          </Link>
          <Link
            href="/checkout/payment"
            className="inline-flex justify-center border border-[var(--lf-purple-deep)] bg-[var(--lf-purple-deep)] px-10 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)] sm:min-w-[14rem]"
          >
            Continue to payment
          </Link>
        </div>
      </div>
    </CheckoutCartGate>
  );
}

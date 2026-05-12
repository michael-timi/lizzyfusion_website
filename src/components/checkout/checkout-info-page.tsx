"use client";

import Link from "next/link";
import { CheckoutCartGate } from "@/components/checkout/checkout-cart-gate";
import { CheckoutCartSidebar } from "@/components/checkout/checkout-cart-sidebar";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { useCheckoutForm } from "@/components/checkout/checkout-context";
import { site } from "@/lib/site";

const input =
  "mt-1.5 w-full border border-[var(--lf-line)] bg-white px-3 py-2.5 text-sm text-[var(--lf-ink)] outline-none transition focus:border-[var(--lf-purple)]";

export function CheckoutInfoPage() {
  const { form, patchForm } = useCheckoutForm();

  return (
    <CheckoutCartGate>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <Link href="/" className="font-serif text-xl font-semibold text-[var(--lf-ink)]">
          {site.name}
        </Link>
        <div className="mt-4">
          <CheckoutSteps active="info" />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:gap-12">
          <div className="min-w-0 space-y-10">
            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h1 className="text-lg font-semibold text-[var(--lf-ink)]">Contact</h1>
                <Link href="/login" className="text-sm text-[var(--lf-purple)] hover:underline">
                  Have an account? Log in
                </Link>
              </div>
              <label className="mt-4 block text-sm font-medium text-[var(--lf-ink)]">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => patchForm({ email: e.target.value })}
                  className={input}
                />
              </label>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-[var(--lf-muted)]">
                <input
                  type="checkbox"
                  checked={form.marketingOptIn}
                  onChange={(e) => patchForm({ marketingOptIn: e.target.checked })}
                  className="accent-[var(--lf-purple)]"
                />
                Email me with news and offers
              </label>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--lf-ink)]">Shipping address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[var(--lf-ink)] sm:col-span-2">
                  Country / region
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => patchForm({ country: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  First name
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => patchForm({ firstName: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  Last name
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => patchForm({ lastName: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)] sm:col-span-2">
                  Company (optional)
                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) => patchForm({ company: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)] sm:col-span-2">
                  Address
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => patchForm({ address: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)] sm:col-span-2">
                  Apartment, suite, etc. (optional)
                  <input
                    type="text"
                    value={form.apartment}
                    onChange={(e) => patchForm({ apartment: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  Postal code
                  <input
                    type="text"
                    value={form.postal}
                    onChange={(e) => patchForm({ postal: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)]">
                  City
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => patchForm({ city: e.target.value })}
                    className={input}
                  />
                </label>
                <label className="block text-sm font-medium text-[var(--lf-ink)] sm:col-span-2">
                  Phone
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => patchForm({ phone: e.target.value })}
                    className={input}
                  />
                </label>
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[var(--lf-muted)]">
                <input
                  type="checkbox"
                  checked={form.saveInfo}
                  onChange={(e) => patchForm({ saveInfo: e.target.checked })}
                  className="accent-[var(--lf-purple)]"
                />
                Save this information for next time
              </label>
            </section>
          </div>

          <CheckoutCartSidebar />
        </div>

        <div className="mt-12 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-[var(--lf-line)] pt-8 sm:flex-row sm:items-center">
          <Link href="/cart" className="text-sm font-medium text-[var(--lf-muted)] hover:text-[var(--lf-ink)]">
            ← Return to cart
          </Link>
          <Link
            href="/checkout/shipping"
            className="inline-flex justify-center border border-[var(--lf-purple-deep)] bg-[var(--lf-purple-deep)] px-10 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)] sm:min-w-[14rem]"
          >
            Continue to shipping
          </Link>
        </div>
      </div>
    </CheckoutCartGate>
  );
}

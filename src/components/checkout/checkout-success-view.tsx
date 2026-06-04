"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackPurchase } from "@/lib/analytics-events";
import { clearOrderSnapshot, readOrderSnapshot, transactionIdForSnapshot } from "@/lib/checkout-order-snapshot";
import { submitOrderFromSnapshot } from "@/lib/firebase-orders";
import { getFirebaseAuth } from "@/lib/firebase-auth";
import { site } from "@/lib/site";

const successTeal = "#2D8A70";

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckoutSuccessView() {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    const snapshot = readOrderSnapshot();
    if (!snapshot) {
      attempted.current = true;
      return;
    }
    attempted.current = true;

    // The snapshot only exists right after a real checkout (cleared below), so the purchase fires
    // once per completed order; `transaction_id` lets GA4 drop any accidental re-fires.
    void trackPurchase({
      transactionId: transactionIdForSnapshot(snapshot),
      value: snapshot.totals.total,
      tax: snapshot.totals.tax,
      shippingTier: snapshot.shipping.shippingMethod,
      items: snapshot.lines.map((l) => ({
        item_id: l.slug,
        item_name: l.name,
        price: l.unitPrice,
        quantity: l.qty,
      })),
      itemCount: snapshot.totals.count,
    });

    const auth = getFirebaseAuth();
    if (!auth?.currentUser) {
      clearOrderSnapshot();
      queueMicrotask(() =>
        setSyncNote(
          "Your confirmation is saved locally. We could not attach a studio order reference because the session ended—contact us with your WhatsApp thread if you need help.",
        ),
      );
      return;
    }

    void (async () => {
      const result = await submitOrderFromSnapshot(snapshot);
      clearOrderSnapshot();
      if (result.ok) {
        setOrderId(result.id);
      } else if (result.error === "no_db") {
        setSyncNote("Order summary could not sync to the studio database (Firebase not configured on this device).");
      } else {
        setSyncNote(
          result.message
            ? `Order reference could not be saved: ${result.message}`
            : "Order reference could not be saved. Your WhatsApp message still has the full details.",
        );
      }
    })();
  }, []);

  return (
    <main className="mx-auto flex min-h-[min(72vh,40rem)] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
      <div
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: successTeal }}
        aria-hidden
      >
        <IconCheck />
      </div>
      <h1 className="mt-8 font-sans text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: successTeal }}>
        Payment successful
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--lf-ink)] sm:text-base">
        Thank you for choosing {site.name}. Your order will be confirmed with you on WhatsApp based on your delivery
        request and the details you shared in checkout.
      </p>
      {orderId ? (
        <p className="mt-4 rounded-md border border-[var(--lf-line)] bg-zinc-50 px-4 py-3 text-sm text-[var(--lf-ink)]">
          Studio order reference: <span className="font-mono font-semibold">{orderId}</span>
        </p>
      ) : null}
      {syncNote ? (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--lf-muted)]" role="status">
          {syncNote}
        </p>
      ) : null}
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--lf-ink)] sm:text-base">
        If you asked for email follow-up, we will use the address from your enquiry. Otherwise, watch for our reply in
        the WhatsApp thread you opened.
      </p>
      <p className="mt-8 text-sm text-[var(--lf-muted)]">Please contact us for any query</p>
      <p className="mt-1 text-sm font-medium text-[var(--lf-ink)]">{site.contact.phoneDisplay}</p>
      <p className="mt-2 text-xs font-medium uppercase tracking-wider text-[var(--lf-muted)]">or</p>
      <p className="mt-2 text-sm font-medium text-[var(--lf-ink)]">
        <a href={`mailto:${site.contact.email}`} className="underline-offset-2 hover:underline">
          {site.contact.email}
        </a>
      </p>
      <Link
        href="/shop"
        className="mt-10 inline-flex min-w-[12rem] items-center justify-center border border-[var(--lf-line)] bg-white px-8 py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
      >
        Continue shopping
      </Link>
    </main>
  );
}

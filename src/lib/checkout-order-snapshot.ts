import type { CheckoutFormState } from "@/components/checkout/checkout-context";
import type { CartLine } from "@/lib/cart";
import { checkoutTotals } from "@/lib/checkout-totals";
import { resolveCartLineDisplay } from "@/lib/site";

export const ORDER_SNAPSHOT_KEY = "lizzy-fusion-order-snapshot-v1";

export type CheckoutTotalsShape = ReturnType<typeof checkoutTotals>;

export type OrderLineSnapshot = {
  slug: string;
  name: string;
  qty: number;
  size: string;
  color: string;
  unitPrice: number;
  lineTotal: number;
};

export type OrderSnapshotV1 = {
  v: 1;
  createdAtIso: string;
  totals: Pick<CheckoutTotalsShape, "subtotal" | "tax" | "total" | "count">;
  lines: OrderLineSnapshot[];
  /** Checkout fields minus card details (never persisted). */
  shipping: Omit<CheckoutFormState, "cardNumber" | "cardMonth" | "cardYear" | "cardCvv">;
  contactEmail: string;
};

export function shippingWithoutCard(form: CheckoutFormState): OrderSnapshotV1["shipping"] {
  const { cardNumber, cardMonth, cardYear, cardCvv, ...safe } = form;
  void cardNumber;
  void cardMonth;
  void cardYear;
  void cardCvv;
  return safe;
}

export function buildOrderSnapshot(
  lines: CartLine[],
  form: CheckoutFormState,
  totals: CheckoutTotalsShape,
): OrderSnapshotV1 | null {
  if (lines.length === 0) return null;
  const lineSnaps: OrderLineSnapshot[] = [];
  for (const line of lines) {
    const p = resolveCartLineDisplay(line);
    if (!p) continue;
    const unitPrice = p.price;
    const lineTotal = unitPrice * line.qty;
    lineSnaps.push({
      slug: line.slug,
      name: p.name,
      qty: line.qty,
      size: line.size,
      color: line.color,
      unitPrice,
      lineTotal,
    });
  }
  if (lineSnaps.length === 0) return null;

  return {
    v: 1,
    createdAtIso: new Date().toISOString(),
    totals: { subtotal: totals.subtotal, tax: totals.tax, total: totals.total, count: totals.count },
    lines: lineSnaps,
    shipping: shippingWithoutCard(form),
    contactEmail: (form.email || form.billingEmail || "").trim() || "unknown@checkout.local",
  };
}

export function persistOrderSnapshot(snapshot: OrderSnapshotV1) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ORDER_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / private mode */
  }
}

export function readOrderSnapshot(): OrderSnapshotV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ORDER_SNAPSHOT_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<OrderSnapshotV1>;
    if (o.v !== 1 || !o.lines || !Array.isArray(o.lines) || !o.totals) return null;
    return o as OrderSnapshotV1;
  } catch {
    return null;
  }
}

export function clearOrderSnapshot() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ORDER_SNAPSHOT_KEY);
  } catch {
    /* noop */
  }
}

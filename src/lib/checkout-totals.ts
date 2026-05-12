import type { CartLine } from "@/lib/cart";
import { getSampleProductBySlug } from "@/lib/site";

/** Placeholder VAT for display only (confirm with your accountant). */
const VAT_RATE = 0.075;

export function checkoutTotals(lines: readonly CartLine[]) {
  let subtotal = 0;
  for (const line of lines) {
    const p = getSampleProductBySlug(line.slug);
    if (p) subtotal += p.price * line.qty;
  }
  const tax = Math.round(subtotal * VAT_RATE);
  const shipping = 0;
  const total = subtotal + tax + shipping;
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return { subtotal, tax, shipping, total, count };
}

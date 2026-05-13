import type { OrderLineSnapshot, OrderSnapshotV1 } from "@/lib/checkout-order-snapshot";

/** Persisted checkout orders (`orders` collection). */
export const ORDER_STATUSES = [
  "submitted",
  "processing",
  "whatsapp_followup",
  "fulfilled",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

export type FirestoreOrderDoc = {
  userId: string;
  status: OrderStatus | string;
  createdAt: { toMillis?: () => number } | null;
  updatedAt?: { toMillis?: () => number } | null;
  contactEmail: string;
  lines: OrderLineSnapshot[];
  totals: OrderSnapshotV1["totals"];
  shipping: Record<string, unknown>;
  source: string;
  snapshotAt: string;
  adminNote?: string;
};

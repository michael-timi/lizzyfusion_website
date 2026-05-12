"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getCartLinesJson, parseStoredCart, subscribeCartStore } from "@/lib/cart";

export function CheckoutCartGate({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribeCartStore, getCartLinesJson, () => "[]");
  const lines = useMemo(() => parseStoredCart(raw), [raw]);
  const router = useRouter();

  useEffect(() => {
    if (lines.length === 0) router.replace("/cart");
  }, [lines.length, router]);

  if (lines.length === 0) {
    return <p className="p-12 text-center text-sm text-[var(--lf-muted)]">Taking you to your cart…</p>;
  }

  return children;
}

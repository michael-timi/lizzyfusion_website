import { trackAddToCart, trackRemoveFromCart } from "@/lib/analytics-events";

const CART_KEY = "lizzy-fusion-cart-v1";

export type CartLine = {
  id: string;
  slug: string;
  qty: number;
  size: string;
  color: string;
  /** Captured at add-to-bag so checkout works for Firestore-only catalogue rows. */
  unitPrice?: number;
  productName?: string;
  productImage?: string;
};

function lineId(slug: string, size: string, color: string): string {
  return `${slug}|||${size}|||${color}`;
}

function isValidCartLine(row: unknown): row is CartLine {
  if (!row || typeof row !== "object") return false;
  const l = row as CartLine;
  const okPrice =
    l.unitPrice === undefined || (typeof l.unitPrice === "number" && Number.isFinite(l.unitPrice));
  const okName = l.productName === undefined || typeof l.productName === "string";
  const okImage = l.productImage === undefined || typeof l.productImage === "string";
  return (
    typeof l.id === "string" &&
    typeof l.slug === "string" &&
    typeof l.qty === "number" &&
    typeof l.size === "string" &&
    typeof l.color === "string" &&
    okPrice &&
    okName &&
    okImage &&
    l.qty > 0
  );
}

export function getCartLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartLine);
  } catch {
    return [];
  }
}

export function setCartLines(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  const cleaned = lines.filter((l) => l.qty > 0);
  localStorage.setItem(CART_KEY, JSON.stringify(cleaned));
  window.dispatchEvent(new Event("lf-cart"));
}

export function subscribeCartStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("lf-cart", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("lf-cart", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function addCartLine(input: {
  slug: string;
  size: string;
  color: string;
  qty?: number;
  unitPrice?: number;
  productName?: string;
  productImage?: string;
}) {
  const qty = input.qty ?? 1;
  const id = lineId(input.slug, input.size, input.color);
  const lines = getCartLines();
  const idx = lines.findIndex((l) => l.id === id);
  if (idx >= 0) {
    const next = [...lines];
    next[idx] = {
      ...next[idx]!,
      qty: next[idx]!.qty + qty,
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.productName !== undefined ? { productName: input.productName } : {}),
      ...(input.productImage !== undefined ? { productImage: input.productImage } : {}),
    };
    setCartLines(next);
    const line = next[idx]!;
    const display = line.productName ?? line.slug;
    void trackAddToCart({
      item_id: line.slug,
      item_name: display,
      price: line.unitPrice,
      quantity: qty,
    });
    return;
  }
  setCartLines([
    ...lines,
    {
      id,
      slug: input.slug,
      size: input.size,
      color: input.color,
      qty,
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.productName !== undefined ? { productName: input.productName } : {}),
      ...(input.productImage !== undefined ? { productImage: input.productImage } : {}),
    },
  ]);
  void trackAddToCart({
    item_id: input.slug,
    item_name: input.productName ?? input.slug,
    price: input.unitPrice,
    quantity: qty,
  });
}

export function updateCartQty(id: string, qty: number) {
  const lines = getCartLines();
  if (qty < 1) {
    const removed = lines.find((l) => l.id === id);
    if (removed) {
      void trackRemoveFromCart({
        item_id: removed.slug,
        item_name: removed.productName ?? removed.slug,
        price: removed.unitPrice,
        quantity: removed.qty,
      });
    }
    setCartLines(lines.filter((l) => l.id !== id));
    return;
  }
  setCartLines(lines.map((l) => (l.id === id ? { ...l, qty } : l)));
}

export function removeCartLine(id: string) {
  const lines = getCartLines();
  const removed = lines.find((l) => l.id === id);
  if (removed) {
    void trackRemoveFromCart({
      item_id: removed.slug,
      item_name: removed.productName ?? removed.slug,
      price: removed.unitPrice,
      quantity: removed.qty,
    });
  }
  setCartLines(lines.filter((l) => l.id !== id));
}

export function clearCart() {
  setCartLines([]);
}

/** JSON snapshot for `useSyncExternalStore` / hydration. */
export function getCartLinesJson(): string {
  try {
    return JSON.stringify(getCartLines());
  } catch {
    return "[]";
  }
}

/** Parse cart JSON from storage or external store snapshot. */
export function parseStoredCart(json: string): CartLine[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartLine);
  } catch {
    return [];
  }
}

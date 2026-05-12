const CART_KEY = "lizzy-fusion-cart-v1";

export type CartLine = {
  id: string;
  slug: string;
  qty: number;
  size: string;
  color: string;
};

function lineId(slug: string, size: string, color: string): string {
  return `${slug}|||${size}|||${color}`;
}

export function getCartLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is CartLine =>
        row &&
        typeof row === "object" &&
        typeof (row as CartLine).id === "string" &&
        typeof (row as CartLine).slug === "string" &&
        typeof (row as CartLine).qty === "number" &&
        typeof (row as CartLine).size === "string" &&
        typeof (row as CartLine).color === "string" &&
        (row as CartLine).qty > 0,
    );
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

export function addCartLine(input: { slug: string; size: string; color: string; qty?: number }) {
  const qty = input.qty ?? 1;
  const id = lineId(input.slug, input.size, input.color);
  const lines = getCartLines();
  const idx = lines.findIndex((l) => l.id === id);
  if (idx >= 0) {
    const next = [...lines];
    next[idx] = { ...next[idx]!, qty: next[idx]!.qty + qty };
    setCartLines(next);
    return;
  }
  setCartLines([...lines, { id, slug: input.slug, size: input.size, color: input.color, qty }]);
}

export function updateCartQty(id: string, qty: number) {
  const lines = getCartLines();
  if (qty < 1) {
    setCartLines(lines.filter((l) => l.id !== id));
    return;
  }
  setCartLines(lines.map((l) => (l.id === id ? { ...l, qty } : l)));
}

export function removeCartLine(id: string) {
  setCartLines(getCartLines().filter((l) => l.id !== id));
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
    return parsed.filter(
      (row): row is CartLine =>
        row &&
        typeof row === "object" &&
        typeof (row as CartLine).id === "string" &&
        typeof (row as CartLine).slug === "string" &&
        typeof (row as CartLine).qty === "number" &&
        typeof (row as CartLine).size === "string" &&
        typeof (row as CartLine).color === "string",
    );
  } catch {
    return [];
  }
}
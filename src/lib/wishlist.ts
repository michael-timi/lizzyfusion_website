import { trackWishlistChange } from "@/lib/analytics-events";

const WISHLIST_KEY = "lizzy-fusion-wishlist-v1";

export function getWishlistSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return [];
  }
}

export function setWishlistSlugs(slugs: string[]) {
  if (typeof window === "undefined") return;
  const unique = [...new Set(slugs)];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(unique));
  window.dispatchEvent(new Event("lf-wishlist"));
}

/** Shared subscription for `useSyncExternalStore` (wishlist UI). */
export function subscribeWishlistStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("lf-wishlist", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("lf-wishlist", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function isWishlisted(slug: string): boolean {
  return getWishlistSlugs().includes(slug);
}

export function toggleWishlist(slug: string): boolean {
  const cur = getWishlistSlugs();
  const has = cur.includes(slug);
  if (has) {
    setWishlistSlugs(cur.filter((s) => s !== slug));
    void trackWishlistChange(slug, false);
    return false;
  }
  setWishlistSlugs([...cur, slug]);
  void trackWishlistChange(slug, true);
  return true;
}

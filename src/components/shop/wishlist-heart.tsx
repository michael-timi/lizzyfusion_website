"use client";

import { useSyncExternalStore } from "react";
import { IconHeart } from "@/components/ui/icon-heart";
import {
  getWishlistSlugs,
  isWishlisted,
  subscribeWishlistStore,
  toggleWishlist,
} from "@/lib/wishlist";

type WishlistHeartProps = {
  slug: string;
  className?: string;
};

export function WishlistHeart({ slug, className = "" }: WishlistHeartProps) {
  const saved = useSyncExternalStore(
    subscribeWishlistStore,
    () => isWishlisted(slug),
    () => false,
  );

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(slug);
      }}
      className={`rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition hover:bg-white ${
        saved ? "text-red-600" : "text-[var(--lf-ink)]"
      } ${className}`}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
    >
      <IconHeart filled={saved} className="block" />
    </button>
  );
}

/** For header badge or counts — length of wishlist on this device. */
export function useWishlistCount() {
  return useSyncExternalStore(
    subscribeWishlistStore,
    () => getWishlistSlugs().length,
    () => 0,
  );
}

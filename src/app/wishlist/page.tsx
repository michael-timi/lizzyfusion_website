import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Wish list",
  description: `Save pieces you love from ${site.name} and return to them anytime.`,
};

export default function WishlistPage() {
  return (
    <main className="min-h-[50vh] bg-white">
      <WishlistView />
    </main>
  );
}

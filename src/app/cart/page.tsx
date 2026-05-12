import type { Metadata } from "next";
import { CartPageView } from "@/components/checkout/cart-page-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your cart",
  description: `Review your bag and continue to checkout · ${site.name}`,
};

export default function CartPage() {
  return (
    <main className="min-h-screen bg-white">
      <CartPageView />
    </main>
  );
}

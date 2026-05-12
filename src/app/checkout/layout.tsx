import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CheckoutProvider } from "@/components/checkout/checkout-context";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Checkout",
  description: `Shipping and payment details · ${site.name}`,
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <CheckoutProvider>
      <div className="min-h-screen bg-white">{children}</div>
    </CheckoutProvider>
  );
}

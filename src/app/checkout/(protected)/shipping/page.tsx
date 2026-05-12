import type { Metadata } from "next";
import { CheckoutShippingPage } from "@/components/checkout/checkout-shipping-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping",
  description: `Choose delivery · ${site.name}`,
};

export default function CheckoutShippingRoute() {
  return <CheckoutShippingPage />;
}

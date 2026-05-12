import type { Metadata } from "next";
import { CheckoutInfoPage } from "@/components/checkout/checkout-info-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact & shipping",
  description: `Enter your details · ${site.name}`,
};

export default function CheckoutInfoRoute() {
  return <CheckoutInfoPage />;
}

import type { Metadata } from "next";
import { CheckoutSuccessView } from "@/components/checkout/checkout-success-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Payment successful",
  description: `Thank you · ${site.name}`,
};

export default function CheckoutSuccessPage() {
  return <CheckoutSuccessView />;
}

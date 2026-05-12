import type { Metadata } from "next";
import { CheckoutPaymentPage } from "@/components/checkout/checkout-payment-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Payment",
  description: `Review and confirm on WhatsApp · ${site.name}`,
};

export default function CheckoutPaymentRoute() {
  return <CheckoutPaymentPage />;
}

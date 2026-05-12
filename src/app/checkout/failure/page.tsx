import type { Metadata } from "next";
import { CheckoutFailureView } from "@/components/checkout/checkout-failure-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Payment could not complete",
  description: `Try checkout again or contact ${site.name}`,
};

export default function CheckoutFailurePage() {
  return <CheckoutFailureView />;
}

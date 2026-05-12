import type { ReactNode } from "react";
import { CheckoutAuthGate } from "@/components/checkout/checkout-auth-gate";

/** Contact, shipping, and payment require sign-in. Success / failure do not (session may end after payment). */
export default function CheckoutProtectedLayout({ children }: { children: ReactNode }) {
  return <CheckoutAuthGate>{children}</CheckoutAuthGate>;
}

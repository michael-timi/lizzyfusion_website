import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordScreen } from "@/components/auth/forgot-password-screen";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reset password",
  description: `Reset your ${site.name} account password.`,
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-[var(--lf-muted)]">Loading…</div>}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}

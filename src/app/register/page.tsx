import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterScreen } from "@/components/auth/register-screen";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Create account",
  description: `Create a ${site.name} account to save preferences and track enquiries when member sign-in launches.`,
};

export default function RegisterPage() {
  return (
    <main>
      <Suspense fallback={<div className="py-24 text-center text-sm text-[var(--lf-muted)]">Loading…</div>}>
        <RegisterScreen />
      </Suspense>
    </main>
  );
}

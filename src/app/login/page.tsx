import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginScreen } from "@/components/auth/login-screen";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Log in",
  description: `Log in to your ${site.name} account when member access is available.`,
};

export default function LoginPage() {
  return (
    <main>
      <Suspense fallback={<div className="py-24 text-center text-sm text-[var(--lf-muted)]">Loading…</div>}>
        <LoginScreen />
      </Suspense>
    </main>
  );
}

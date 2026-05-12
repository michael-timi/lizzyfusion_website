"use client";

import { FirebaseAuthProvider } from "@/components/auth/firebase-auth-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}

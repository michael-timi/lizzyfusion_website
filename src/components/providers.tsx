"use client";

import { ClientNetworkLogger } from "@/components/client-network-logger";
import { FirebaseAuthProvider } from "@/components/auth/firebase-auth-provider";
import { SignedOutToast } from "@/components/auth/signed-out-toast";
import { FirebaseClientInit } from "@/components/firebase-client-init";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseAuthProvider>
      <ClientNetworkLogger />
      <FirebaseClientInit />
      <SignedOutToast />
      {children}
    </FirebaseAuthProvider>
  );
}

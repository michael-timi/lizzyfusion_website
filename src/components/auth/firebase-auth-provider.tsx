"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-auth";

type FirebaseAuthContextValue = {
  user: User | null;
  loading: boolean;
  /** True after mount when Firebase web config is present (client can use Auth). */
  configured: boolean;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue>({
  user: null,
  loading: true,
  configured: false,
});

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = mounted && Boolean(getFirebaseAuth());

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const auth = getFirebaseAuth();
    if (!auth) {
      queueMicrotask(() => {
        setUser(null);
        setLoading(false);
      });
      return;
    }
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });
    return () => unsub();
  }, [mounted]);

  const value = useMemo(() => ({ user, loading, configured }), [user, loading, configured]);
  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}

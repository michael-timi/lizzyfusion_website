"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState, startTransition } from "react";
import { getFirebaseAuth } from "@/lib/firebase-auth";
import { getFirebaseDb } from "@/lib/firebase-db";
import { setAnalyticsUserId } from "@/lib/firebase-analytics";
import { syncUserProfileFromAuth } from "@/lib/firebase-user-profile";

type FirebaseAuthContextValue = {
  user: User | null;
  loading: boolean;
  /** True after mount when Firebase web config is present (client can use Auth). */
  configured: boolean;
  /** From Firestore `users/{uid}.userType` (live); false when logged out or not admin. */
  isAdmin: boolean;
  /** Waiting for first Firestore profile snapshot while `user` is set. */
  profileLoading: boolean;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue>({
  user: null,
  loading: true,
  configured: false,
  isAdmin: false,
  profileLoading: false,
});

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
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
      void setAnalyticsUserId(next?.uid ?? null);
      if (next) {
        void syncUserProfileFromAuth(next).catch(() => {
          /* Firestore offline / rules — avoid surfacing in auth layer */
        });
      }
    });
    return () => unsub();
  }, [mounted]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      return;
    }
    startTransition(() => {
      setProfileLoading(true);
    });
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setProfileLoading(false);
        const t = snap.data()?.userType;
        setIsAdmin(typeof t === "string" && t.toLowerCase() === "admin");
      },
      () => {
        setProfileLoading(false);
        setIsAdmin(false);
      },
    );
    return () => {
      unsub();
      startTransition(() => {
        setIsAdmin(false);
        setProfileLoading(false);
      });
    };
  }, [user?.uid]);

  const value = useMemo(
    () => ({ user, loading, configured, isAdmin, profileLoading }),
    [user, loading, configured, isAdmin, profileLoading],
  );
  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}

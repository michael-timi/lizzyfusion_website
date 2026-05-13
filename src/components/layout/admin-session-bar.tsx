"use client";

import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";

/** Site-wide strip when an admin profile is signed in (below announcement bar). */
export function AdminSessionBar() {
  const { user, isAdmin, loading } = useFirebaseAuth();
  if (loading || !user || !isAdmin) return null;
  return (
    <div
      className="border-b border-amber-800/25 bg-amber-400 px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950 sm:text-xs"
      role="status"
    >
      <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-950" />
      Admin session — elevated access
    </div>
  );
}

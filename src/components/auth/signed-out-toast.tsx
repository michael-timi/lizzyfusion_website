"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuthSuccessBanner } from "@/components/auth/auth-feedback";
import { LF_SIGNED_OUT_EVENT } from "@/lib/firebase-auth";

const AUTO_DISMISS_MS = 5500;

export function SignedOutToast() {
  const [open, setOpen] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setOpen(false);
    if (dismissTimerRef.current != null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    setOpen(true);
    if (dismissTimerRef.current != null) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      dismissTimerRef.current = null;
      setOpen(false);
    }, AUTO_DISMISS_MS);
  }, []);

  useEffect(() => {
    const onSignedOut = () => {
      show();
    };
    window.addEventListener(LF_SIGNED_OUT_EVENT, onSignedOut);
    return () => {
      window.removeEventListener(LF_SIGNED_OUT_EVENT, onSignedOut);
      if (dismissTimerRef.current != null) clearTimeout(dismissTimerRef.current);
    };
  }, [show]);

  if (!open) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex justify-center px-4 pb-6 sm:pb-8"
      role="presentation"
    >
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2 shadow-lg">
        <AuthSuccessBanner>
          You are signed out. Sign in again anytime from the account menu.
        </AuthSuccessBanner>
        <button
          type="button"
          onClick={hide}
          className="self-end rounded-md bg-emerald-900/10 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-900/15"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

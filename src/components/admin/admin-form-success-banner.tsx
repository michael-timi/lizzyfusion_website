"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  children?: ReactNode;
  onDismiss: () => void;
  action?: { href: string; label: string };
};

/**
 * Fixed bottom success alert — mirrors AdminFormErrorBanner so confirmations stay
 * visible when the user is scrolled to long-form actions at the bottom.
 */
export function AdminFormSuccessBanner({ title, children, onDismiss, action }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-emerald-300 bg-emerald-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-lg sm:rounded-xl sm:border sm:border-emerald-300 sm:shadow-lg"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-2xl items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
        >
          ✓
        </span>
        <div className="min-w-0 flex-1 text-sm text-emerald-950">
          <p className="font-semibold leading-snug">{title}</p>
          {children ? <div className="mt-1 leading-relaxed text-emerald-900/90">{children}</div> : null}
          {action ? (
            <p className="mt-2">
              <Link href={action.href} className="font-semibold text-emerald-900 underline underline-offset-2">
                {action.label}
              </Link>
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-900 underline-offset-2 hover:bg-emerald-100 hover:underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

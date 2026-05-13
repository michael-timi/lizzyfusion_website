/** Inline auth feedback — keep styling consistent across login, register, checkout gate. */

export function AuthErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-relaxed text-red-800"
      role="alert"
    >
      {children}
    </p>
  );
}

export function AuthNoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-relaxed text-[var(--lf-muted)]">
      {children}
    </p>
  );
}

export function AuthSuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-900"
      role="status"
    >
      {children}
    </p>
  );
}

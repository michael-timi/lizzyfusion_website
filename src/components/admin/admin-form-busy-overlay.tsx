"use client";

type Props = {
  active: boolean;
  title: string;
  message?: string;
};

/** Semi-transparent overlay on a long admin form while an async save is in progress. */
export function AdminFormBusyOverlay({ active, title, message }: Props) {
  if (!active) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/85 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-8 py-7 shadow-lg">
        <span
          className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-zinc-200 border-t-[var(--lf-purple-deep)]"
          aria-hidden="true"
        />
        <div className="text-center">
          <p className="text-sm font-semibold text-[var(--lf-ink)]">{title}</p>
          {message ? <p className="mt-1.5 text-xs leading-relaxed text-[var(--lf-muted)]">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}

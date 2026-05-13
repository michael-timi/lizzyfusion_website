"use client";

type Props = {
  message: string | null;
  onDismiss: () => void;
};

/**
 * Fixed bottom alert so validation/API errors stay visible while the user is scrolled
 * to the primary actions at the end of a long admin form.
 */
export function AdminFormErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-red-200 bg-red-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-lg sm:rounded-xl sm:border sm:border-red-200 sm:shadow-lg"
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto flex max-w-2xl items-start gap-3">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-red-900">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-800 underline-offset-2 hover:bg-red-100 hover:underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

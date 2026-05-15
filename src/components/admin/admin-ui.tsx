import Link from "next/link";
import type { ReactNode } from "react";

export type AdminAccent = "purple" | "violet" | "amber" | "emerald" | "sky" | "rose" | "ink";

const accentStyles: Record<
  AdminAccent,
  { card: string; icon: string; ring: string; text: string }
> = {
  purple: {
    card: "border-violet-200/80 bg-gradient-to-br from-[var(--lf-purple-faint)] to-white",
    icon: "bg-[var(--lf-purple)] text-white",
    ring: "ring-violet-200",
    text: "text-[var(--lf-purple-deep)]",
  },
  violet: {
    card: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white",
    icon: "bg-violet-600 text-white",
    ring: "ring-violet-200",
    text: "text-violet-900",
  },
  amber: {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white",
    icon: "bg-amber-600 text-white",
    ring: "ring-amber-200",
    text: "text-amber-950",
  },
  emerald: {
    card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white",
    icon: "bg-emerald-600 text-white",
    ring: "ring-emerald-200",
    text: "text-emerald-950",
  },
  sky: {
    card: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white",
    icon: "bg-sky-600 text-white",
    ring: "ring-sky-200",
    text: "text-sky-950",
  },
  rose: {
    card: "border-rose-200/80 bg-gradient-to-br from-rose-50 to-white",
    icon: "bg-rose-600 text-white",
    ring: "ring-rose-200",
    text: "text-rose-950",
  },
  ink: {
    card: "border-zinc-200 bg-gradient-to-br from-zinc-50 to-white",
    icon: "bg-zinc-800 text-white",
    ring: "ring-zinc-200",
    text: "text-[var(--lf-ink)]",
  },
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lf-purple)]">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--lf-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  accent = "ink",
  href,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: AdminAccent;
  href?: string;
  icon?: ReactNode;
}) {
  const styles = accentStyles[accent];
  const inner = (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${styles.card} ${href ? "hover:border-[var(--lf-purple)]/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--lf-muted)]">{label}</p>
          <p className={`mt-2 font-serif text-3xl font-semibold tabular-nums tracking-tight ${styles.text}`}>
            {value}
          </p>
          {hint ? <p className="mt-1.5 text-xs leading-relaxed text-[var(--lf-muted)]">{hint}</p> : null}
        </div>
        {icon ? (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${styles.icon}`}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function AdminQuickAction({
  href,
  label,
  description,
  accent = "purple",
  external,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  accent?: AdminAccent;
  external?: boolean;
  icon?: ReactNode;
}) {
  const styles = accentStyles[accent];
  const className = `group flex h-full flex-col rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${styles.card}`;
  const content = (
    <>
      <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${styles.icon}`}>
        {icon}
      </span>
      <span className={`text-sm font-semibold ${styles.text} group-hover:underline`}>{label}</span>
      <span className="mt-1 text-xs leading-relaxed text-[var(--lf-muted)]">{description}</span>
    </>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

const statusTone: Record<string, { bg: string; text: string }> = {
  submitted: { bg: "bg-amber-100", text: "text-amber-900" },
  processing: { bg: "bg-sky-100", text: "text-sky-900" },
  whatsapp_followup: { bg: "bg-violet-100", text: "text-violet-900" },
  fulfilled: { bg: "bg-emerald-100", text: "text-emerald-900" },
  cancelled: { bg: "bg-zinc-200", text: "text-zinc-700" },
};

export function AdminStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const tone = statusTone[key] ?? { bg: "bg-zinc-100", text: "text-zinc-700" };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.bg} ${tone.text}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AdminFilterPills({
  options,
  value,
  onChange,
  label = "Filter",
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--lf-muted)]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-[var(--lf-purple-deep)] bg-[var(--lf-purple-deep)] text-white shadow-sm"
                  : "border-zinc-200 bg-white text-[var(--lf-ink)] hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
              }`}
            >
              {opt.label}
              {opt.count !== undefined ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-zinc-100 text-[var(--lf-muted)]"
                  }`}
                >
                  {opt.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminPanel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/80 px-5 py-4">
        <h3 className="font-semibold text-[var(--lf-ink)]">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

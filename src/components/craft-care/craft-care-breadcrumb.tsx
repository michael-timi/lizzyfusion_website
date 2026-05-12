import Link from "next/link";

export type CraftCrumb = { label: string; href?: string };

export function CraftCareBreadcrumb({ items }: { items: CraftCrumb[] }) {
  return (
    <nav className="text-sm text-[var(--lf-muted)]" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center">
            {i > 0 ? <span className="mx-1 text-zinc-300" aria-hidden>/</span> : null}
            {item.href ? (
              <Link href={item.href} className="transition hover:text-[var(--lf-ink)]">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-[var(--lf-ink)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

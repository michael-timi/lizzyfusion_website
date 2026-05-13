"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ADMIN_SECTIONS } from "@/components/admin/admin-nav";
import { fetchAdminOrderCount, fetchAdminUserCount, subscribeAdminOrders } from "@/lib/admin-firestore";
import type { FirestoreOrderDoc } from "@/lib/admin-types";
import { site, whatsappHref } from "@/lib/site";

export function AdminDashboardHome() {
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<{ id: string; data: FirestoreOrderDoc }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [oc, uc] = await Promise.all([fetchAdminOrderCount(), fetchAdminUserCount()]);
        if (!alive) return;
        setOrderCount(oc);
        setUserCount(uc);
      } catch {
        if (alive) setErr("Could not load counts.");
      }
    })();
    const unsub = subscribeAdminOrders(
      (rows) => {
        if (!alive) return;
        setRecent(rows.slice(0, 6));
        setErr(null);
      },
      (e) => setErr(e.message),
    );
    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  const wa = whatsappHref(`*${site.name} — admin*\nQuick studio check-in from the dashboard.`);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lf-muted)]">Today</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-[var(--lf-ink)] sm:text-3xl">Studio overview</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--lf-muted)]">
          Orders and customers sync from Firebase. Catalogue copy and prices still ship from the codebase until you
          wire a CMS.
        </p>
      </div>

      {err ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
          {err}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Orders (loaded)</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-[var(--lf-ink)]">
            {orderCount === null ? "…" : orderCount}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Profiles</p>
          <p className="mt-2 font-serif text-3xl font-semibold text-[var(--lf-ink)]">
            {userCount === null ? "…" : userCount}
          </p>
        </div>
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-[var(--lf-line)] bg-[var(--lf-purple-faint)] p-5 shadow-sm transition hover:border-[var(--lf-purple)]"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-purple-deep)]">WhatsApp</p>
          <p className="mt-2 text-sm font-semibold text-[var(--lf-ink)]">Open studio thread</p>
          <p className="mt-1 text-xs text-[var(--lf-muted)]">Prefilled admin note to the team</p>
        </a>
        <Link
          href="/admin/orders"
          className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-[var(--lf-ink)]"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Queue</p>
          <p className="mt-2 text-sm font-semibold text-[var(--lf-ink)]">Review latest orders →</p>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--lf-ink)]">Latest orders</h3>
          <ul className="mt-4 divide-y divide-zinc-100">
            {recent.length === 0 ? (
              <li className="py-4 text-sm text-[var(--lf-muted)]">No orders yet—or still loading.</li>
            ) : (
              recent.map(({ id, data }) => (
                <li key={id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--lf-ink)]">{data.contactEmail}</p>
                    <p className="text-xs capitalize text-[var(--lf-muted)]">{String(data.status)}</p>
                  </div>
                  <Link href={`/admin/orders/${id}`} className="shrink-0 text-xs font-semibold text-[var(--lf-purple)]">
                    Open
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-[var(--lf-ink)]">Sections</h3>
          <ul className="mt-4 space-y-2">
            {ADMIN_SECTIONS.filter((s) => s.href !== "/admin").map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="group flex flex-col rounded-lg border border-transparent px-2 py-2 hover:border-zinc-100 hover:bg-zinc-50">
                  <span className="text-sm font-semibold text-[var(--lf-ink)] group-hover:text-[var(--lf-purple-deep)]">
                    {s.label}
                  </span>
                  <span className="text-xs text-[var(--lf-muted)]">{s.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

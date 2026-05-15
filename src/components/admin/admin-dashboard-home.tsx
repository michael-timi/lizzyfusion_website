"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AdminFilterPills,
  AdminPanel,
  AdminQuickAction,
  AdminStatCard,
  AdminStatusBadge,
} from "@/components/admin/admin-ui";
import { ADMIN_NAV_GROUPS, ADMIN_SECTIONS } from "@/components/admin/admin-nav";
import {
  fetchAdminCatalogCount,
  fetchAdminOrderCount,
  fetchAdminUserCount,
  formatFirestoreTime,
  subscribeAdminOrders,
} from "@/lib/admin-firestore";
import type { FirestoreOrderDoc } from "@/lib/admin-types";
import { ORDER_STATUSES } from "@/lib/admin-types";
import { formatNgn, site, whatsappHref } from "@/lib/site";

type OrderRow = { id: string; data: FirestoreOrderDoc };

function IconOrders() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6h12l-1.5 9H7.5L6 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCatalog() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16v12H4V7Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7V5h8v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.7 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm0 2a8 8 0 0 1 6.8 12.2l.2.2-.7 2.6-2.6.7-.2-.2A8 8 0 1 1 12 4Zm-2.2 4.5c.1 2.2 1.9 4 4.1 4.1.8.1 1.6-.2 2.2-.7l.5-.5c.2-.2.2-.5 0-.7l-1-1c-.2-.2-.5-.2-.7 0l-.4.4c-.2.2-.5.2-.7 0-.6-.4-1.1-.9-1.5-1.5-.1-.2-.1-.5.1-.7l.4-.4c.2-.2.2-.5 0-.7l-1-1c-.2-.2-.5-.2-.7 0l-.5.5c-.6.6-.9 1.4-.7 2.2Z" />
    </svg>
  );
}

function orderTotalNgn(data: FirestoreOrderDoc): number | null {
  const t = data.totals;
  if (!t || typeof t !== "object") return null;
  const total = (t as { total?: unknown }).total;
  if (typeof total === "number" && Number.isFinite(total)) return Math.round(total);
  return null;
}

export function AdminDashboardHome() {
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [oc, uc, cc] = await Promise.all([
          fetchAdminOrderCount(),
          fetchAdminUserCount(),
          fetchAdminCatalogCount(),
        ]);
        if (!alive) return;
        setOrderCount(oc);
        setUserCount(uc);
        setCatalogCount(cc);
      } catch {
        if (alive) setErr("Could not load summary counts.");
      }
    })();
    const unsub = subscribeAdminOrders(
      (rows) => {
        if (!alive) return;
        setOrders(rows);
        setErr(null);
      },
      (e) => setErr(e.message),
    );
    return () => {
      alive = false;
      unsub?.();
    };
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of ORDER_STATUSES) counts[s] = 0;
    for (const { data } of orders) {
      const key = String(data.status);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  const openOrders = useMemo(
    () => orders.filter((o) => !["fulfilled", "cancelled"].includes(String(o.data.status))).length,
    [orders],
  );

  const recentValueNgn = useMemo(() => {
    let sum = 0;
    let n = 0;
    for (const { data } of orders.slice(0, 20)) {
      const v = orderTotalNgn(data);
      if (v !== null) {
        sum += v;
        n += 1;
      }
    }
    return n > 0 ? sum : null;
  }, [orders]);

  const filterOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All", count: orders.length }];
    for (const s of ORDER_STATUSES) {
      if ((statusCounts[s] ?? 0) > 0) {
        opts.push({ value: s, label: s.replace(/_/g, " "), count: statusCounts[s] });
      }
    }
    return opts;
  }, [orders.length, statusCounts]);

  const filteredRecent = useMemo(() => {
    const list = orders.slice(0, 12);
    if (statusFilter === "all") return list;
    return list.filter((r) => String(r.data.status) === statusFilter);
  }, [orders, statusFilter]);

  const wa = whatsappHref(`*${site.name} — admin*\nQuick studio check-in from the dashboard.`);

  const today = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const sectionsByGroup = ADMIN_NAV_GROUPS.map((g) => ({
    ...g,
    items: ADMIN_SECTIONS.filter((s) => s.group === g.id && s.href !== "/admin"),
  }));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-[var(--lf-purple-deep)] via-[var(--lf-purple)] to-violet-700 px-6 py-8 text-white shadow-lg sm:px-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-fuchsia-400/20 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">{today}</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Studio dashboard</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">
            Orders and customers sync live from Firebase. Manage catalogue, featured pins, and journal content from the
            sections below.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/orders"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--lf-purple-deep)] shadow-sm transition hover:bg-violet-50"
            >
              Review orders
            </Link>
            <Link
              href="/admin/catalog/add"
              className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Add product
            </Link>
          </div>
        </div>
      </section>

      {err ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
          {err}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Orders"
          value={orderCount === null ? "…" : orderCount}
          hint={`${openOrders} open in live feed`}
          accent="purple"
          href="/admin/orders"
          icon={<IconOrders />}
        />
        <AdminStatCard
          label="Customers"
          value={userCount === null ? "…" : userCount}
          hint="Registered profiles"
          accent="sky"
          href="/admin/customers"
          icon={<IconUsers />}
        />
        <AdminStatCard
          label="Catalogue"
          value={catalogCount === null ? "…" : catalogCount}
          hint="Firestore products"
          accent="emerald"
          href="/admin/catalog"
          icon={<IconCatalog />}
        />
        <AdminStatCard
          label="Recent value"
          value={recentValueNgn === null ? "—" : formatNgn(recentValueNgn)}
          hint="Last 20 orders (loaded)"
          accent="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminPanel
          title="Latest orders"
          className="xl:col-span-2"
          action={
            <Link href="/admin/orders" className="text-xs font-semibold text-[var(--lf-purple)] hover:underline">
              View all →
            </Link>
          }
        >
          <AdminFilterPills options={filterOptions} value={statusFilter} onChange={setStatusFilter} label="Status" />
          <ul className="mt-5 divide-y divide-zinc-100">
            {filteredRecent.length === 0 ? (
              <li className="py-8 text-center text-sm text-[var(--lf-muted)]">
                No orders match this filter—or still loading.
              </li>
            ) : (
              filteredRecent.map(({ id, data }) => {
                const total = orderTotalNgn(data);
                return (
                  <li key={id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--lf-ink)]">{data.contactEmail}</p>
                      <p className="mt-0.5 text-xs text-[var(--lf-muted)]">{formatFirestoreTime(data.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {total !== null ? (
                        <span className="text-sm font-semibold tabular-nums text-[var(--lf-ink)]">
                          {formatNgn(total)}
                        </span>
                      ) : null}
                      <AdminStatusBadge status={String(data.status)} />
                      <Link
                        href={`/admin/orders/${id}`}
                        className="shrink-0 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-[var(--lf-purple)] hover:border-[var(--lf-purple)]"
                      >
                        Open
                      </Link>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </AdminPanel>

        <div className="space-y-4">
          <AdminQuickAction
            href={wa}
            label="WhatsApp studio"
            description="Open a prefilled thread to the team"
            accent="emerald"
            external
            icon={<IconWhatsApp />}
          />
          <AdminQuickAction
            href="/admin/catalog/add"
            label="New catalogue piece"
            description="Hero upload + Gemini suggestions"
            accent="violet"
            icon={<IconCatalog />}
          />
          <AdminQuickAction
            href="/admin/featured"
            label="Featured placements"
            description="Homepage tiles & lookbook days"
            accent="amber"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {sectionsByGroup.map((group) => (
          <AdminPanel key={group.id} title={group.label}>
            <ul className="space-y-1">
              {group.items.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="group flex items-start gap-3 rounded-xl border border-transparent px-3 py-3 transition hover:border-violet-100 hover:bg-[var(--lf-purple-faint)]/60"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-[var(--lf-purple-deep)]">
                      {s.label.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--lf-ink)] group-hover:text-[var(--lf-purple-deep)]">
                        {s.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-[var(--lf-muted)]">
                        {s.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </AdminPanel>
        ))}
      </div>
    </div>
  );
}

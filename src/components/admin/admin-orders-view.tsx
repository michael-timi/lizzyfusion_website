"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { subscribeAdminOrders, formatFirestoreTime, updateOrderAdminFields } from "@/lib/admin-firestore";
import type { FirestoreOrderDoc } from "@/lib/admin-types";
import { ORDER_STATUSES } from "@/lib/admin-types";
import { formatNgn } from "@/lib/site";

type Row = { id: string; data: FirestoreOrderDoc };

export function AdminOrdersView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeAdminOrders(
      (list) => {
        setRows(list);
        setError(null);
      },
      (e) => setError(e.message),
    );
    return () => unsub?.();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => String(r.data.status) === statusFilter);
  }, [rows, statusFilter]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>(ORDER_STATUSES);
    rows.forEach((r) => set.add(String(r.data.status)));
    return Array.from(set);
  }, [rows]);

  async function patchStatus(id: string, status: string) {
    setBusyId(id);
    const res = await updateOrderAdminFields(id, { status });
    setBusyId(null);
    if (!res.ok) setError(res.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Orders</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--lf-muted)]">
            Submitted after checkout success. Update status as you progress the WhatsApp conversation—buyers still see
            their copy in email/session.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
          Filter
          <select
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-normal normal-case text-[var(--lf-ink)]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Customer email</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map(({ id, data }) => (
              <tr key={id} className="hover:bg-zinc-50/80">
                <td className="whitespace-nowrap px-4 py-3 text-[var(--lf-muted)]">{formatFirestoreTime(data.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-[var(--lf-ink)]">{data.contactEmail}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{formatNgn(data.totals.total)}</td>
                <td className="px-4 py-3">
                  <select
                    className="max-w-[11rem] rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs capitalize"
                    value={String(data.status)}
                    disabled={busyId === id}
                    onChange={(e) => void patchStatus(id, e.target.value)}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${id}`} className="font-semibold text-[var(--lf-purple)] hover:underline">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--lf-muted)]">No orders match this filter.</p>
        ) : null}
      </div>
    </div>
  );
}

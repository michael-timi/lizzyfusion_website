"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeAdminUsers } from "@/lib/admin-firestore";
import type { UserProfileDoc } from "@/lib/firebase-user-profile";

type Row = { id: string; data: UserProfileDoc };

export function AdminCustomersView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const unsub = subscribeAdminUsers(
      (list) => {
        setRows(list);
        setError(null);
      },
      (e) => setError(e.message),
    );
    return () => unsub?.();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      ({ data }) =>
        (data.email ?? "").toLowerCase().includes(t) ||
        (data.displayName ?? "").toLowerCase().includes(t) ||
        (data.firstName ?? "").toLowerCase().includes(t) ||
        (data.lastName ?? "").toLowerCase().includes(t),
    );
  }, [rows, q]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Customers</h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--lf-muted)]">
          Firebase Auth profiles mirrored to <code className="rounded bg-zinc-100 px-1 text-xs">users</code>. Promote
          admins only in the Firebase console—clients cannot change <code className="rounded bg-zinc-100 px-1 text-xs">userType</code>.
        </p>
      </div>

      <label className="block max-w-md text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
        Search
        <input
          type="search"
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal normal-case text-[var(--lf-ink)]"
          placeholder="Email or name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-[640px] w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Provider</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.map(({ id, data }) => (
              <tr key={id} className="hover:bg-zinc-50/80">
                <td className="px-4 py-3 font-medium text-[var(--lf-ink)]">{data.email ?? "—"}</td>
                <td className="px-4 py-3 text-[var(--lf-muted)]">{data.displayName ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                      data.userType === "admin" ? "bg-amber-100 text-amber-950" : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {data.userType}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--lf-muted)]">{data.primaryProvider ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[var(--lf-muted)]">No profiles match.</p>
        ) : null}
      </div>
    </div>
  );
}

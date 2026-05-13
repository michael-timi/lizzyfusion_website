"use client";

import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { startTransition, useEffect, useMemo, useState } from "react";
import { formatFirestoreTime, updateOrderAdminFields } from "@/lib/admin-firestore";
import type { FirestoreOrderDoc } from "@/lib/admin-types";
import { ORDER_STATUSES, isOrderStatus } from "@/lib/admin-types";
import { getFirebaseDb } from "@/lib/firebase-db";
import { formatNgn, site, whatsappHref } from "@/lib/site";

type Props = { orderId: string };

export function AdminOrderDetailView({ orderId }: Props) {
  const [data, setData] = useState<FirestoreOrderDoc | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      startTransition(() => {
        setData(null);
        setError("Firestore not configured.");
      });
      return;
    }
    const ref = doc(db, "orders", orderId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setData(null);
          return;
        }
        const d = snap.data() as FirestoreOrderDoc;
        setData(d);
        setNote(typeof d.adminNote === "string" ? d.adminNote : "");
        setError(null);
      },
      (e) => setError(e.message),
    );
    return () => unsub();
  }, [orderId]);

  const statusOptions = useMemo(() => {
    if (data === undefined || data === null) return [...ORDER_STATUSES];
    return [...new Set([...ORDER_STATUSES, String(data.status)])];
  }, [data]);

  const statusValue = useMemo(() => {
    if (!data) return "submitted";
    return String(data.status);
  }, [data]);

  async function saveNote() {
    if (!data) return;
    setSaving(true);
    const st = isOrderStatus(String(data.status)) ? data.status : "submitted";
    const res = await updateOrderAdminFields(orderId, { status: st, adminNote: note });
    setSaving(false);
    if (!res.ok) setError(res.message);
  }

  if (data === undefined && !error) {
    return <p className="text-sm text-[var(--lf-muted)]">Loading order…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--lf-muted)]">Order not found.</p>
        <Link href="/admin/orders" className="text-sm font-semibold text-[var(--lf-purple)] underline">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const waLines = [
    `*${site.name} — order follow-up*`,
    `Order ref: ${orderId}`,
    `Customer: ${data.contactEmail}`,
    `Total: ${formatNgn(data.totals.total)}`,
    `Status: ${data.status}`,
    "",
    "(Add your message for the studio)",
  ];
  const wa = whatsappHref(waLines.join("\n"));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/orders" className="text-sm font-semibold text-[var(--lf-purple)] hover:underline">
          ← Orders
        </Link>
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#128C7E] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-95"
        >
          WhatsApp follow-up
        </a>
      </div>

      <div>
        <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Order {orderId}</h2>
        <p className="mt-1 text-sm text-[var(--lf-muted)]">
          Placed {formatFirestoreTime(data.createdAt)} · Snapshot {data.snapshotAt}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Status</h3>
          <select
            className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm capitalize"
            value={statusValue}
            onChange={(e) =>
              void (async () => {
                setSaving(true);
                const res = await updateOrderAdminFields(orderId, {
                  status: e.target.value,
                  adminNote: note,
                });
                setSaving(false);
                if (!res.ok) setError(res.message);
              })()
            }
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Totals</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--lf-muted)]">Items</dt>
              <dd className="font-medium tabular-nums">{data.totals.count}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--lf-muted)]">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatNgn(data.totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--lf-muted)]">Tax</dt>
              <dd className="font-medium tabular-nums">{formatNgn(data.totals.tax)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-zinc-100 pt-2">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold tabular-nums">{formatNgn(data.totals.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Internal note</h3>
        <p className="mt-1 text-xs text-[var(--lf-muted)]">Visible to admins in Firestore and this dashboard.</p>
        <textarea
          className="mt-3 min-h-[6rem] w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Fitting scheduled, fabric pending, etc."
        />
        <button
          type="button"
          className="mt-3 rounded-full bg-[var(--lf-ink)] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
          disabled={saving}
          onClick={() => void saveNote()}
        >
          {saving ? "Saving…" : "Save note"}
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Lines</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-zinc-100 text-left text-xs uppercase tracking-wider text-[var(--lf-muted)]">
              <tr>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">Size</th>
                <th className="py-2 pr-4">Colour</th>
                <th className="py-2">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {data.lines.map((line) => (
                <tr key={`${line.slug}-${line.size}-${line.color}`}>
                  <td className="py-2 pr-4 font-medium">{line.name}</td>
                  <td className="py-2 pr-4 tabular-nums">{line.qty}</td>
                  <td className="py-2 pr-4">{line.size}</td>
                  <td className="py-2 pr-4">{line.color}</td>
                  <td className="py-2 font-semibold tabular-nums">{formatNgn(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Shipping &amp; contact (sanitised)</h3>
        <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700">
          {JSON.stringify(data.shipping, null, 2)}
        </pre>
      </div>
    </div>
  );
}

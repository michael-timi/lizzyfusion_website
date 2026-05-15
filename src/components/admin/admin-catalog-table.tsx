"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type AdminCatalogRow = {
  slug: string;
  name: string;
  tag: string;
  priceLabel: string;
  priceWasLabel?: string;
  origin: "Firestore only" | "Code" | "Firestore override";
  hasRemote: boolean;
  hasStyleVariants: boolean;
};

type OriginFilter = "all" | AdminCatalogRow["origin"];
type FirestoreFilter = "all" | "in-firestore" | "code-only";
type StyleFilter = "all" | "multi-style" | "single-price";

const inputClass = "input";

type Props = { rows: AdminCatalogRow[] };

export function AdminCatalogTable({ rows }: Props) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState<OriginFilter>("all");
  const [firestoreFilter, setFirestoreFilter] = useState<FirestoreFilter>("all");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("all");

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.tag.trim()) set.add(r.tag.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !`${r.slug} ${r.name} ${r.tag}`.toLowerCase().includes(q)) return false;
      if (tagFilter !== "all" && r.tag !== tagFilter) return false;
      if (originFilter !== "all" && r.origin !== originFilter) return false;
      if (firestoreFilter === "in-firestore" && !r.hasRemote) return false;
      if (firestoreFilter === "code-only" && r.hasRemote) return false;
      if (styleFilter === "multi-style" && !r.hasStyleVariants) return false;
      if (styleFilter === "single-price" && r.hasStyleVariants) return false;
      return true;
    });
  }, [rows, search, tagFilter, originFilter, firestoreFilter, styleFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    tagFilter !== "all" ||
    originFilter !== "all" ||
    firestoreFilter !== "all" ||
    styleFilter !== "all";

  function clearFilters() {
    setSearch("");
    setTagFilter("all");
    setOriginFilter("all");
    setFirestoreFilter("all");
    setStyleFilter("all");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div
          className="min-w-[12rem] flex-1"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="catalog-filter-search">
            Search
          </label>
          <input
            id="catalog-filter-search"
            type="search"
            className={`${inputClass} mt-1`}
            placeholder="Name, slug, or collection…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div
          className="min-w-[10rem]"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="catalog-filter-tag">
            Collection
          </label>
          <select
            id="catalog-filter-tag"
            className={`${inputClass} mt-1`}
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="all">All collections</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div
          className="min-w-[10rem]"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="catalog-filter-origin">
            Origin
          </label>
          <select
            id="catalog-filter-origin"
            className={`${inputClass} mt-1`}
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as OriginFilter)}
          >
            <option value="all">All origins</option>
            <option value="Firestore only">Firestore only</option>
            <option value="Code">Code</option>
            <option value="Firestore override">Firestore override</option>
          </select>
        </div>
        <div
          className="min-w-[10rem]"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="catalog-filter-firestore">
            Firestore doc
          </label>
          <select
            id="catalog-filter-firestore"
            className={`${inputClass} mt-1`}
            value={firestoreFilter}
            onChange={(e) => setFirestoreFilter(e.target.value as FirestoreFilter)}
          >
            <option value="all">All</option>
            <option value="in-firestore">Has Firestore row</option>
            <option value="code-only">Code default only</option>
          </select>
        </div>
        <div
          className="min-w-[10rem]"
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="catalog-filter-style">
            Pricing
          </label>
          <select
            id="catalog-filter-style"
            className={`${inputClass} mt-1`}
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value as StyleFilter)}
          >
            <option value="all">All</option>
            <option value="multi-style">Multiple styles</option>
            <option value="single-price">Single price</option>
          </select>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--lf-purple)] transition hover:border-[var(--lf-purple)]"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <p className="text-sm text-[var(--lf-muted)]">
        Showing <span className="font-semibold text-[var(--lf-ink)]">{filtered.length}</span> of{" "}
        <span className="font-semibold text-[var(--lf-ink)]">{rows.length}</span> pieces
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-[var(--lf-muted)]">
          No products match these filters.{" "}
          <button type="button" onClick={clearFilters} className="font-semibold text-[var(--lf-purple)] hover:underline">
            Clear filters
          </button>
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm"
        >
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
              <tr>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Collection</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Origin</th>
                <th className="px-4 py-3">Firestore</th>
                <th className="px-4 py-3">Storefront</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((p) => (
                <tr key={p.slug} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">{p.slug}</td>
                  <td className="px-4 py-3 font-medium text-[var(--lf-ink)]">
                    {p.name}
                    {p.hasStyleVariants ? (
                      <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                        Multi-style
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--lf-muted)]">{p.tag}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {p.priceWasLabel ? (
                      <span className="inline-flex flex-col items-end gap-0.5">
                        <span className="text-xs font-medium text-zinc-500 line-through">{p.priceWasLabel}</span>
                        <span className="text-[var(--lf-ink)]">{p.priceLabel}</span>
                      </span>
                    ) : (
                      p.priceLabel
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--lf-muted)]">{p.origin}</td>
                  <td className="px-4 py-3">
                    {p.hasRemote ? (
                      <Link
                        href={`/admin/catalog/edit/${encodeURIComponent(p.slug)}`}
                        className="font-semibold text-[var(--lf-purple)] hover:underline"
                      >
                        Edit
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/shop/${p.slug}`} className="font-semibold text-[var(--lf-purple)] hover:underline">
                      View PDP
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

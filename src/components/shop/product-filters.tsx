"use client";

import { useMemo, useState } from "react";
export type SortKey = "featured" | "price-asc" | "price-desc";

type ProductFiltersProps = {
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
  selectedCollections: Set<string>;
  onToggleCollection: (label: string) => void;
  onClearAll: () => void;
  /** Collection labels from the live catalogue (merged with site specialties). */
  collectionOptions: readonly string[];
};

const fabrics = ["Cotton", "Linen", "Silk", "Crepe", "Chiffon"] as const;
const sizes = ["XS", "S / US (4–6)", "M", "L", "XL"] as const;

export function ProductFilters({
  sort,
  onSortChange,
  selectedCollections,
  onToggleCollection,
  onClearAll,
  collectionOptions,
}: ProductFiltersProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const chips = useMemo(
    () => Array.from(selectedCollections).map((c) => ({ label: c, key: c })),
    [selectedCollections],
  );

  return (
    <aside className="lg:w-[min(100%,17rem)] lg:shrink-0">
      <h2 className="font-serif text-xl font-semibold text-[var(--lf-ink)] sm:text-2xl">Filters</h2>

      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => onToggleCollection(c.label)}
              className="inline-flex items-center gap-2 border border-[var(--lf-line)] bg-zinc-50 px-3 py-1.5 text-xs font-medium text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)]"
            >
              {c.label}
              <span className="text-[var(--lf-muted)]">×</span>
            </button>
          ))}
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClearAll}
            className="border border-[var(--lf-line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)]"
          >
            Clear all filters
          </button>
          <span className="flex items-center border border-[var(--lf-purple-deep)] bg-[var(--lf-purple-deep)] px-4 py-2 text-xs font-semibold text-white">
            Applied filters
          </span>
        </div>
      ) : null}

      <div className="mt-6 space-y-2">
        <FilterAccordion
          id="sort"
          title="Sort by"
          openId={openId}
          setOpenId={setOpenId}
        >
          {(
            [
              ["featured", "Featured"],
              ["price-asc", "Price · low to high"],
              ["price-desc", "Price · high to low"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input
                type="radio"
                name="sort"
                checked={sort === key}
                onChange={() => onSortChange(key)}
                className="accent-[var(--lf-purple)]"
              />
              {label}
            </label>
          ))}
        </FilterAccordion>

        <FilterAccordion id="size" title="Size" openId={openId} setOpenId={setOpenId}>
          <p className="mb-2 text-xs text-[var(--lf-muted)]">
            Note sizes on WhatsApp when you enquire—this list is for planning only.
          </p>
          {sizes.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input type="checkbox" className="accent-[var(--lf-purple)]" />
              {s}
            </label>
          ))}
        </FilterAccordion>

        <FilterAccordion id="color" title="Color" openId={openId} setOpenId={setOpenId}>
          <div className="space-y-2">
            {(
              [
                ["#1a1a1a", "Black"],
                ["#6d4c41", "Brown"],
                ["#c9a227", "Gold"],
                ["#4a6741", "Olive"],
                ["#902a8f", "Plum"],
              ] as const
            ).map(([hex, name]) => (
              <label key={hex} className="flex cursor-pointer items-center gap-3 py-0.5 text-sm">
                <span
                  className="h-6 w-6 shrink-0 rounded-full border border-zinc-200 shadow-inner"
                  style={{ backgroundColor: hex }}
                />
                {name}
              </label>
            ))}
          </div>
        </FilterAccordion>

        <FilterAccordion id="collection" title="Collection" openId={openId} setOpenId={setOpenId}>
          <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
            {collectionOptions.length === 0 ? (
              <p className="text-xs text-[var(--lf-muted)]">No collections in the current list.</p>
            ) : (
              collectionOptions.map((label) => (
                <label key={label} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCollections.has(label)}
                    onChange={() => onToggleCollection(label)}
                    className="accent-[var(--lf-purple)]"
                  />
                  {label}
                </label>
              ))
            )}
          </div>
        </FilterAccordion>

        <FilterAccordion id="fabric" title="Fabric" openId={openId} setOpenId={setOpenId}>
          {fabrics.map((f) => (
            <label key={f} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
              <input type="checkbox" className="accent-[var(--lf-purple)]" />
              {f}
            </label>
          ))}
        </FilterAccordion>
      </div>
    </aside>
  );
}

function FilterAccordion({
  id,
  title,
  openId,
  setOpenId,
  children,
}: {
  id: string;
  title: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  children: React.ReactNode;
}) {
  const open = openId === id;
  return (
    <div className="border border-transparent">
      <button
        type="button"
        onClick={() => setOpenId(open ? null : id)}
        className="flex w-full items-center justify-between bg-[var(--lf-purple-deep)] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
      >
        {title}
        <span className="text-lg font-light leading-none">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="border border-t-0 border-[var(--lf-line)] bg-white px-4 py-3">{children}</div> : null}
    </div>
  );
}

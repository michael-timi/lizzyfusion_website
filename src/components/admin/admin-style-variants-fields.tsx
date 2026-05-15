"use client";

import { useMemo } from "react";
import {
  DEFAULT_STYLE_VARIANT_PRESETS,
  MAX_STYLE_VARIANTS,
  slugifyStyleVariantId,
  type CatalogStyleVariant,
} from "@/lib/catalog-style-variants";

export type StyleVariantDraft = {
  id: string;
  label: string;
  priceStr: string;
  compareAtStr: string;
  imageUrl: string;
  imageFile: File | null;
};

export function emptyStyleVariantDraft(preset?: { id: string; label: string }): StyleVariantDraft {
  return {
    id: preset?.id ?? "",
    label: preset?.label ?? "",
    priceStr: "",
    compareAtStr: "",
    imageUrl: "",
    imageFile: null,
  };
}

export function styleDraftsFromSuggestVariants(
  variants: ReadonlyArray<{ id: string; label: string; priceNgn: number }>,
): StyleVariantDraft[] {
  return variants.map((v) => ({
    id: v.id,
    label: v.label,
    priceStr: String(v.priceNgn),
    compareAtStr: "",
    imageUrl: "",
    imageFile: null,
  }));
}

export function styleVariantsFromFirestore(rows: CatalogStyleVariant[] | undefined): StyleVariantDraft[] {
  if (!rows?.length) return DEFAULT_STYLE_VARIANT_PRESETS.map((p) => emptyStyleVariantDraft(p));
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    priceStr: String(r.price),
    compareAtStr: r.compareAtPrice !== undefined ? String(r.compareAtPrice) : "",
    imageUrl: r.image ?? "",
    imageFile: null,
  }));
}

type Props = {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  drafts: StyleVariantDraft[];
  onDraftsChange: (drafts: StyleVariantDraft[]) => void;
  disabled?: boolean;
};

const inputClass = "input";

export function AdminStyleVariantsFields({ enabled, onEnabledChange, drafts, onDraftsChange, disabled }: Props) {
  const canAdd = drafts.length < MAX_STYLE_VARIANTS;

  const updateRow = (index: number, patch: Partial<StyleVariantDraft>) => {
    const next = drafts.map((d, i) => (i === index ? { ...d, ...patch } : d));
    onDraftsChange(next);
  };

  const presetLabels = useMemo(() => DEFAULT_STYLE_VARIANT_PRESETS.map((p) => p.label).join(", "), []);

  return (
    <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/40 p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
        Dress styles & prices
      </legend>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--lf-ink)]">
        <input
          type="checkbox"
          className="mt-1 accent-[var(--lf-purple-deep)]"
          checked={enabled}
          disabled={disabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        <span>
          <span className="font-medium">This piece has multiple styles with different prices</span>
          <span className="mt-0.5 block text-xs font-normal text-[var(--lf-muted)]">
            e.g. full long gown, short gown, and children&apos;s sizing. Shoppers pick a style on the product page; clicking
            a gallery image tied to a style updates the price shown. Shop listings use the lowest price as &quot;From&quot;.
          </span>
        </span>
      </label>

      {enabled ? (
        <div className="space-y-4">
          <p className="text-xs text-[var(--lf-muted)]">
            Suggested styles: {presetLabels}. Add a photo per style (optional) so the PDP gallery switches price when that
            image is selected.
          </p>
          <ul className="space-y-4">
            {drafts.map((row, index) => (
              <li key={`${row.id}-${index}`} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                    Style {index + 1}
                  </span>
                  {drafts.length > 1 ? (
                    <button
                      type="button"
                      disabled={disabled}
                      className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                      onClick={() => onDraftsChange(drafts.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-[var(--lf-muted)]">Label</label>
                    <input
                      className={`${inputClass} mt-1`}
                      value={row.label}
                      disabled={disabled}
                      onChange={(e) => {
                        const label = e.target.value;
                        updateRow(index, {
                          label,
                          id: row.id || slugifyStyleVariantId(label),
                        });
                      }}
                      placeholder="Full long gown"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--lf-muted)]">Price (₦)</label>
                    <input
                      className={`${inputClass} mt-1`}
                      inputMode="numeric"
                      value={row.priceStr}
                      disabled={disabled}
                      onChange={(e) => updateRow(index, { priceStr: e.target.value })}
                      placeholder="85000"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[var(--lf-muted)]">Compare-at (₦, optional)</label>
                    <input
                      className={`${inputClass} mt-1`}
                      inputMode="numeric"
                      value={row.compareAtStr}
                      disabled={disabled}
                      onChange={(e) => updateRow(index, { compareAtStr: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <label className="block text-xs font-medium text-[var(--lf-muted)]">Style image (optional)</label>
                  <input
                    className={inputClass}
                    value={row.imageUrl}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { imageUrl: e.target.value, imageFile: null })}
                    placeholder="https://… or upload below"
                  />
                  <label className="inline-flex cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-[var(--lf-ink)] hover:border-[var(--lf-purple)]">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={disabled}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        updateRow(index, { imageFile: f, imageUrl: "" });
                        e.target.value = "";
                      }}
                    />
                    Upload style photo
                  </label>
                  {row.imageFile ? <p className="text-xs text-[var(--lf-muted)]">{row.imageFile.name}</p> : null}
                </div>
              </li>
            ))}
          </ul>
          {canAdd ? (
            <button
              type="button"
              disabled={disabled}
              className="text-sm font-semibold text-[var(--lf-purple)] hover:underline disabled:opacity-50"
              onClick={() => onDraftsChange([...drafts, emptyStyleVariantDraft()])}
            >
              + Add another style
            </button>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}

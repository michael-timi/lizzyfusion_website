"use client";

import type { StyleVariantDraft } from "@/components/admin/admin-style-variants-fields";
import { slugifyStyleVariantId } from "@/lib/catalog-style-variants";
import type { GalleryStyleLink } from "@/lib/catalog-style-variants";

type Props = {
  imageUrls: string[];
  styleDrafts: StyleVariantDraft[];
  /** url → selected style ids */
  linksByUrl: Record<string, string[]>;
  onLinksChange: (links: Record<string, string[]>) => void;
  disabled?: boolean;
};

export function galleryStyleLinksFromRecord(
  linksByUrl: Record<string, string[]>,
): GalleryStyleLink[] | undefined {
  const out: GalleryStyleLink[] = [];
  for (const [image, styleIds] of Object.entries(linksByUrl)) {
    const ids = styleIds.filter(Boolean);
    if (image.startsWith("https://") && ids.length > 0) out.push({ image, styleIds: ids });
  }
  return out.length > 0 ? out : undefined;
}

export function galleryStyleLinksToRecord(links: GalleryStyleLink[] | undefined): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!links) return out;
  for (const l of links) {
    if (l.image && l.styleIds.length > 0) out[l.image] = [...l.styleIds];
  }
  return out;
}

/** Map admin UI keys (blob preview or https) to final Storage URLs when publishing. */
export function resolveGalleryStyleLinksForSave(
  linksByUrl: Record<string, string[]>,
  urlMap: ReadonlyArray<{ from: string; to: string }>,
): GalleryStyleLink[] | undefined {
  const byHttps: Record<string, string[]> = {};
  for (const [from, ids] of Object.entries(linksByUrl)) {
    if (!ids.length) continue;
    const to =
      from.startsWith("https://") ? from : urlMap.find((m) => m.from === from)?.to;
    if (!to?.startsWith("https://")) continue;
    const merged = new Set([...(byHttps[to] ?? []), ...ids]);
    byHttps[to] = [...merged];
  }
  return galleryStyleLinksFromRecord(byHttps);
}

export function AdminGalleryStyleLinks({
  imageUrls,
  styleDrafts,
  linksByUrl,
  onLinksChange,
  disabled,
}: Props) {
  const styleOptions = styleDrafts
    .map((d) => ({
      id: slugifyStyleVariantId(d.id) || slugifyStyleVariantId(d.label),
      label: d.label.trim() || d.id,
    }))
    .filter((o) => o.id && o.label);

  if (styleOptions.length === 0 || imageUrls.length === 0) return null;

  const toggle = (url: string, styleId: string) => {
    const current = linksByUrl[url] ?? [];
    const next = current.includes(styleId) ? current.filter((x) => x !== styleId) : [...current, styleId];
    onLinksChange({ ...linksByUrl, [url]: next });
  };

  const setPreset = (url: string, ids: string[]) => {
    onLinksChange({ ...linksByUrl, [url]: ids });
  };

  const adultIds = styleOptions.filter((o) => o.id !== "children").map((o) => o.id);
  const allIds = styleOptions.map((o) => o.id);

  return (
    <div className="min-w-0 space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-[var(--lf-ink)]">Which styles does each photo show?</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--lf-muted)]">
          One image often shows several options together (e.g. full long + short on the same mannequin, or adult beside
          children&apos;s). Tick every style that appears in each photo so the shop updates prices correctly when that
          image is selected.
        </p>
      </div>
      <ul className="space-y-4">
        {imageUrls.map((url) => {
          const selected = linksByUrl[url] ?? [];
          const shortLabel = url.length > 56 ? `${url.slice(0, 56)}…` : url;
          return (
            <li key={url} className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3">
              <p className="break-all font-mono text-[11px] text-[var(--lf-muted)]" title={url}>
                {shortLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {adultIds.length >= 2 ? (
                  <button
                    type="button"
                    disabled={disabled}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-[var(--lf-ink)] hover:border-[var(--lf-purple)] disabled:opacity-50"
                    onClick={() => setPreset(url, adultIds)}
                  >
                    All adult lengths
                  </button>
                ) : null}
                {allIds.length >= 2 ? (
                  <button
                    type="button"
                    disabled={disabled}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-[var(--lf-ink)] hover:border-[var(--lf-purple)] disabled:opacity-50"
                    onClick={() => setPreset(url, allIds)}
                  >
                    All styles in photo
                  </button>
                ) : null}
                {selected.length > 0 ? (
                  <button
                    type="button"
                    disabled={disabled}
                    className="text-[11px] font-semibold text-[var(--lf-purple)] hover:underline disabled:opacity-50"
                    onClick={() => setPreset(url, [])}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {styleOptions.map((opt) => (
                  <label key={`${url}-${opt.id}`} className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      className="accent-[var(--lf-purple-deep)]"
                      disabled={disabled}
                      checked={selected.includes(opt.id)}
                      onChange={() => toggle(url, opt.id)}
                    />
                    <span className="wrap-break-word text-[var(--lf-ink)]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

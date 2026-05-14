"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { AdminFormErrorBanner } from "@/components/admin/admin-form-error-banner";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import type { CatalogProduct } from "@/lib/catalog";
import { getFirebaseDb } from "@/lib/firebase-db";
import { requestSiteFeaturedRevalidation } from "@/lib/site-featured-revalidate-client";
import {
  resolveLookPair,
  resolveTileProduct,
  type ResolutionSource,
  type SiteFeatured,
} from "@/lib/site-featured";
import { landingMedia, site } from "@/lib/site";

const AUTO = "__auto__";

type TileDraft = Record<string, string>;
type LookDraft = Record<string, { a: string; b: string }>;

function sourceLabel(s: ResolutionSource): { text: string; tone: "pin" | "auto" | "miss" } {
  if (s === "pin") return { text: "Pinned by admin", tone: "pin" };
  if (s === "keywords") return { text: "Auto from keywords", tone: "auto" };
  return { text: "No match — search fallback", tone: "miss" };
}

function ToneBadge({ tone, children }: { tone: "pin" | "auto" | "miss"; children: React.ReactNode }) {
  const cls =
    tone === "pin"
      ? "bg-[var(--lf-purple-faint)] text-[var(--lf-purple-deep)] border-[var(--lf-purple)]/30"
      : tone === "auto"
        ? "bg-zinc-100 text-zinc-700 border-zinc-200"
        : "bg-amber-50 text-amber-900 border-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}

function buildTileDraft(featured: SiteFeatured): TileDraft {
  const out: TileDraft = {};
  for (const t of landingMedia.collectionTiles) {
    out[t.label] = featured.collectionTilePins[t.label] ?? AUTO;
  }
  return out;
}

function buildLookDraft(featured: SiteFeatured): LookDraft {
  const out: LookDraft = {};
  for (const d of landingMedia.lookbook) {
    const pair = featured.lookbookPins[d.label];
    out[d.label] = pair ? { a: pair[0], b: pair[1] } : { a: AUTO, b: AUTO };
  }
  return out;
}

function draftToFeatured(tiles: TileDraft, looks: LookDraft): SiteFeatured {
  const collectionTilePins: Record<string, string> = {};
  for (const [k, v] of Object.entries(tiles)) {
    if (v !== AUTO) collectionTilePins[k] = v;
  }
  const lookbookPins: Record<string, readonly [string, string]> = {};
  for (const [k, v] of Object.entries(looks)) {
    // Half-pinned pairs are intentionally rejected here so the storefront resolver gets a clean
    // "either both or neither" signal. The UI surfaces that as a warning below the row.
    if (v.a !== AUTO && v.b !== AUTO && v.a !== v.b) {
      lookbookPins[k] = [v.a, v.b] as const;
    }
  }
  return { collectionTilePins, lookbookPins };
}

export function AdminFeaturedView({
  catalog,
  featured,
}: {
  catalog: readonly CatalogProduct[];
  featured: SiteFeatured;
}) {
  const db = useMemo(() => getFirebaseDb(), []);
  const { user, isAdmin, profileLoading } = useFirebaseAuth();

  const [tileDraft, setTileDraft] = useState<TileDraft>(() => buildTileDraft(featured));
  const [lookDraft, setLookDraft] = useState<LookDraft>(() => buildLookDraft(featured));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const sortedCatalog = useMemo(
    () => [...catalog].sort((x, y) => x.name.localeCompare(y.name)),
    [catalog],
  );

  const draftFeatured: SiteFeatured = useMemo(
    () => draftToFeatured(tileDraft, lookDraft),
    [tileDraft, lookDraft],
  );

  const initialFeatured = featured;
  const isDirty = useMemo(() => {
    if (
      JSON.stringify(draftFeatured.collectionTilePins) !==
      JSON.stringify(initialFeatured.collectionTilePins)
    )
      return true;
    if (
      JSON.stringify(draftFeatured.lookbookPins) !== JSON.stringify(initialFeatured.lookbookPins)
    )
      return true;
    return false;
  }, [draftFeatured, initialFeatured]);

  async function onSave() {
    setError(null);
    if (!db) {
      setError("Firestore is not available in this browser session.");
      return;
    }
    if (!user || !isAdmin || profileLoading) {
      setError("You must be signed in as an admin to save Featured pins.");
      return;
    }
    setBusy(true);
    try {
      const payload: SiteFeatured = draftFeatured;
      await setDoc(doc(db, "site_featured", "v1"), payload);
      await requestSiteFeaturedRevalidation(user);
      setSavedAt(Date.now());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save Featured pins.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function resetDraft() {
    setTileDraft(buildTileDraft(featured));
    setLookDraft(buildLookDraft(featured));
    setError(null);
    setSavedAt(null);
  }

  const canSave = Boolean(user && isAdmin && !profileLoading && db && isDirty);

  return (
    <div className={`space-y-8 ${error ? "pb-28 sm:pb-8" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Featured pins</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--lf-muted)]">
            Pin specific catalogue products to the homepage tiles and lookbook days. Leave a slot on{" "}
            <strong className="font-semibold text-[var(--lf-ink)]">Auto</strong> to let the
            storefront resolve it from keywords in{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">src/lib/site.ts</code>. Pins that
            point to a deleted product silently fall back to Auto, so the site never breaks.
          </p>
        </div>
        <Link href="/admin/catalog" className="text-sm font-semibold text-[var(--lf-purple)] hover:underline">
          ← Catalogue list
        </Link>
      </div>

      {savedAt !== null ? (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900"
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">Saved — homepage, shop hero, and lookbook will reflect these pins immediately.</p>
        </div>
      ) : null}

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <header>
          <h3 className="font-serif text-lg font-semibold text-[var(--lf-ink)]">Collection tiles</h3>
          <p className="mt-1 text-xs text-[var(--lf-muted)]">
            One tile maps to one PDP link on the homepage and the /shop hero. Tile keys come from{" "}
            <code className="rounded bg-zinc-100 px-1 text-[11px]">landingMedia.collectionTiles[*].label</code>.
          </p>
        </header>

        <ul className="divide-y divide-zinc-100">
          {landingMedia.collectionTiles.map((tile) => {
            const draftSlug = tileDraft[tile.label] ?? AUTO;
            const previewFeatured: SiteFeatured =
              draftSlug !== AUTO
                ? {
                    collectionTilePins: { ...draftFeatured.collectionTilePins, [tile.label]: draftSlug },
                    lookbookPins: draftFeatured.lookbookPins,
                  }
                : {
                    collectionTilePins: Object.fromEntries(
                      Object.entries(draftFeatured.collectionTilePins).filter(([k]) => k !== tile.label),
                    ),
                    lookbookPins: draftFeatured.lookbookPins,
                  };
            const res = resolveTileProduct(previewFeatured, catalog, tile);
            const badge = sourceLabel(res.source);
            return (
              <li key={tile.label} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] sm:items-center sm:gap-6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--lf-ink)]">{tile.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--lf-muted)]">
                    Keywords: {tile.keywords.join(", ")}
                  </p>
                </div>
                <div className="space-y-2 sm:space-y-1.5">
                  <select
                    className="input"
                    value={draftSlug}
                    onChange={(e) =>
                      setTileDraft((d) => ({ ...d, [tile.label]: e.target.value }))
                    }
                  >
                    <option value={AUTO}>Auto (resolve from keywords)</option>
                    {sortedCatalog.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} · {p.slug}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--lf-muted)]">
                    <ToneBadge tone={badge.tone}>{badge.text}</ToneBadge>
                    {res.product ? (
                      <span>
                        → <code className="rounded bg-zinc-100 px-1 text-[11px]">{res.product.slug}</code> ({res.product.name})
                      </span>
                    ) : (
                      <span>
                        → <code className="rounded bg-zinc-100 px-1 text-[11px]">{res.href}</code>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <header>
          <h3 className="font-serif text-lg font-semibold text-[var(--lf-ink)]">Lookbook days</h3>
          <p className="mt-1 text-xs text-[var(--lf-muted)]">
            Each day&rsquo;s &ldquo;shop the look&rdquo; pair. Pin <strong className="font-semibold">both</strong> slots
            or leave both on Auto — half-pinned pairs revert to keyword resolution so the look never
            displays a stale half.
          </p>
        </header>

        <ul className="space-y-4">
          {landingMedia.lookbook.map((look) => {
            const draft = lookDraft[look.label] ?? { a: AUTO, b: AUTO };
            const halfPinned =
              (draft.a !== AUTO && draft.b === AUTO) || (draft.a === AUTO && draft.b !== AUTO);
            const duplicate = draft.a !== AUTO && draft.a === draft.b;
            const previewFeatured: SiteFeatured =
              !halfPinned && !duplicate && draft.a !== AUTO && draft.b !== AUTO
                ? {
                    collectionTilePins: draftFeatured.collectionTilePins,
                    lookbookPins: { ...draftFeatured.lookbookPins, [look.label]: [draft.a, draft.b] as const },
                  }
                : {
                    collectionTilePins: draftFeatured.collectionTilePins,
                    lookbookPins: Object.fromEntries(
                      Object.entries(draftFeatured.lookbookPins).filter(([k]) => k !== look.label),
                    ),
                  };
            const res = resolveLookPair(previewFeatured, catalog, look);
            const badge = sourceLabel(res.source);
            return (
              <li
                key={look.label}
                className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--lf-ink)]">
                    {look.label}{" "}
                    <span className="font-normal text-[var(--lf-muted)]">· {look.caption}</span>
                  </p>
                  <ToneBadge tone={badge.tone}>{badge.text}</ToneBadge>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]"
                      htmlFor={`${look.label}-a`}
                    >
                      Slot 1
                    </label>
                    <select
                      id={`${look.label}-a`}
                      className="input mt-1.5"
                      value={draft.a}
                      onChange={(e) =>
                        setLookDraft((d) => ({ ...d, [look.label]: { ...draft, a: e.target.value } }))
                      }
                    >
                      <option value={AUTO}>
                        Auto (keywords: {look.shopKeywords[0].join(", ")})
                      </option>
                      {sortedCatalog.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name} · {p.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]"
                      htmlFor={`${look.label}-b`}
                    >
                      Slot 2
                    </label>
                    <select
                      id={`${look.label}-b`}
                      className="input mt-1.5"
                      value={draft.b}
                      onChange={(e) =>
                        setLookDraft((d) => ({ ...d, [look.label]: { ...draft, b: e.target.value } }))
                      }
                    >
                      <option value={AUTO}>
                        Auto (keywords: {look.shopKeywords[1].join(", ")})
                      </option>
                      {sortedCatalog.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name} · {p.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {halfPinned ? (
                  <p className="mt-2 text-xs text-amber-900">
                    Half-pinned pair — both slots will fall back to Auto when you save.
                  </p>
                ) : null}
                {duplicate ? (
                  <p className="mt-2 text-xs text-amber-900">
                    Both slots point to the same product — pair will fall back to Auto when you save.
                  </p>
                ) : null}
                {res.pair ? (
                  <p className="mt-3 text-xs text-[var(--lf-muted)]">
                    → <code className="rounded bg-zinc-100 px-1 text-[11px]">{res.pair[0].slug}</code> +{" "}
                    <code className="rounded bg-zinc-100 px-1 text-[11px]">{res.pair[1].slug}</code>
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-amber-900">
                    No catalogue products match — this look will render with an empty pair.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || !canSave}
          onClick={() => void onSave()}
          className="rounded-full bg-[var(--lf-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple-deep)] disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save Featured pins"}
        </button>
        {isDirty ? (
          <button
            type="button"
            onClick={resetDraft}
            className="text-sm font-semibold text-[var(--lf-purple)] hover:underline"
          >
            Discard changes
          </button>
        ) : (
          <span className="text-xs text-[var(--lf-muted)]">No unsaved changes.</span>
        )}
        <p className="ml-auto text-xs text-[var(--lf-muted)]">
          Saving writes <code className="rounded bg-zinc-100 px-1 text-[11px]">site_featured/v1</code> and
          revalidates {site.name}.
        </p>
      </div>

      <AdminFormErrorBanner message={error} onDismiss={() => setError(null)} />
    </div>
  );
}

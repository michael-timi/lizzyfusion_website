"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import type { CatalogProduct } from "@/lib/catalog";
import { uploadCatalogProductHeroImage } from "@/lib/catalog-product-image-upload";
import { AdminFormErrorBanner } from "@/components/admin/admin-form-error-banner";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { getFirebaseDb } from "@/lib/firebase-db";
import { getFirebaseStorage } from "@/lib/firebase-storage";

const inputClass = "input";

type ImageMode = "url" | "file";

type Props = { catalogSlug: string };

export function AdminEditProductView({ catalogSlug }: Props) {
  const router = useRouter();
  const db = useMemo(() => getFirebaseDb(), []);
  const storage = useMemo(() => getFirebaseStorage(), []);
  const { user, isAdmin, profileLoading } = useFirebaseAuth();

  const [loadState, setLoadState] = useState<"loading" | "missing" | "ready">("loading");
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [compareAtStr, setCompareAtStr] = useState("");
  const [lead, setLead] = useState("");
  const [description, setDescription] = useState("");
  const [imageMode, setImageMode] = useState<ImageMode>("url");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const [galleryControlled, setGalleryControlled] = useState(false);
  const [galleryLines, setGalleryLines] = useState("");
  const [fittingNotes, setFittingNotes] = useState("");
  const [fabricCareNotes, setFabricCareNotes] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [craftFabricNotes, setCraftFabricNotes] = useState("");
  const [craftFabricLabelsInput, setCraftFabricLabelsInput] = useState("");
  const [colourAvailabilityNotes, setColourAvailabilityNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    queueMicrotask(() => setFilePreviewUrl(url));
    return () => {
      URL.revokeObjectURL(url);
      queueMicrotask(() => setFilePreviewUrl(null));
    };
  }, [imageFile]);

  useEffect(() => {
    if (!db || !catalogSlug) {
      queueMicrotask(() => setLoadState("missing"));
      return;
    }
    let cancelled = false;
    void (async () => {
      const snap = await getDoc(doc(db, "catalog_products", catalogSlug));
      if (cancelled) return;
      if (!snap.exists()) {
        queueMicrotask(() => setLoadState("missing"));
        return;
      }
      const data = snap.data() as Partial<CatalogProduct>;
      if (data.slug !== catalogSlug) {
        queueMicrotask(() => setLoadState("missing"));
        return;
      }
      queueMicrotask(() => {
        if (cancelled) return;
        setName(typeof data.name === "string" ? data.name : "");
        setTag(typeof data.tag === "string" ? data.tag : "");
        setPriceStr(typeof data.price === "number" && Number.isFinite(data.price) ? String(data.price) : "");
        setCompareAtStr(
          typeof data.compareAtPrice === "number" && Number.isFinite(data.compareAtPrice)
            ? String(Math.round(data.compareAtPrice))
            : "",
        );
        setLead(typeof data.lead === "string" ? data.lead : "");
        setDescription(typeof data.description === "string" ? data.description : "");
        setImage(typeof data.image === "string" ? data.image : "");
        setImageMode("url");
        setImageFile(null);

        const hasGalleryKey = "galleryImageUrls" in data && data.galleryImageUrls !== undefined;
        setGalleryControlled(hasGalleryKey);
        setGalleryLines(
          Array.isArray(data.galleryImageUrls) ? data.galleryImageUrls.filter((u) => typeof u === "string").join("\n") : "",
        );
        setFittingNotes(typeof data.fittingNotes === "string" ? data.fittingNotes : "");
        setFabricCareNotes(typeof data.fabricCareNotes === "string" ? data.fabricCareNotes : "");
        setShippingNotes(typeof data.shippingNotes === "string" ? data.shippingNotes : "");
        setCraftFabricNotes(typeof data.craftFabricNotes === "string" ? data.craftFabricNotes : "");
        setColourAvailabilityNotes(typeof data.colourAvailabilityNotes === "string" ? data.colourAvailabilityNotes : "");
        setCraftFabricLabelsInput(
          Array.isArray(data.craftFabricLabels)
            ? data.craftFabricLabels.filter((x) => typeof x === "string").join(", ")
            : "",
        );

        setLoadState("ready");
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [db, catalogSlug]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedAt(null);
    if (!db) {
      setError("Firestore is not available in this browser session.");
      return;
    }
    if (!user || !isAdmin || profileLoading) {
      setError("You must be signed in as an admin to update catalogue products.");
      return;
    }

    const price = Math.round(Number(priceStr.replace(/,/g, "")));
    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be a non-negative number (stored as whole Naira).");
      return;
    }

    let compareAtPrice: number | undefined;
    const compareRaw = compareAtStr.trim().replace(/,/g, "");
    if (compareRaw.length > 0) {
      const cap = Math.round(Number(compareRaw));
      if (!Number.isFinite(cap) || cap <= price) {
        setError(
          "Compare-at price (optional) must be a whole Naira amount strictly greater than the current price, or leave it blank.",
        );
        return;
      }
      compareAtPrice = cap;
    }

    if (!name.trim() || !tag.trim() || !lead.trim() || !description.trim()) {
      setError("Name, collection tag, lead time, and description are required.");
      return;
    }

    let img = image.trim();
    setBusy(true);
    try {
      if (imageMode === "file" && imageFile && storage) {
        const { downloadUrl } = await uploadCatalogProductHeroImage(storage, user.uid, catalogSlug, imageFile);
        img = downloadUrl;
      }

      if (!img.startsWith("https://")) {
        setError("Image must be an https URL (paste a link or upload a file).");
        return;
      }

      const ref = doc(db, "catalog_products", catalogSlug);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError("Product document disappeared. Reload the page.");
        return;
      }
      const prev = snap.data() as Record<string, unknown>;
      const next: Record<string, unknown> = { ...prev };

      next.slug = catalogSlug;
      next.name = name.trim();
      next.tag = tag.trim();
      next.price = price;
      if (compareAtPrice !== undefined) next.compareAtPrice = compareAtPrice;
      else delete next.compareAtPrice;
      next.lead = lead.trim();
      next.description = description.trim();
      next.image = img;

      if (galleryControlled) {
        const lines = galleryLines
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("https://"))
          .slice(0, 6);
        next.galleryImageUrls = lines;
      } else {
        delete next.galleryImageUrls;
      }

      const setOptionalString = (key: string, val: string) => {
        if (val.trim()) next[key] = val.trim();
        else delete next[key];
      };
      setOptionalString("fittingNotes", fittingNotes);
      setOptionalString("fabricCareNotes", fabricCareNotes);
      setOptionalString("shippingNotes", shippingNotes);
      setOptionalString("craftFabricNotes", craftFabricNotes);
      setOptionalString("colourAvailabilityNotes", colourAvailabilityNotes);

      const labels = craftFabricLabelsInput
        .split(/[\n,]+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 8);
      if (labels.length) next.craftFabricLabels = labels;
      else delete next.craftFabricLabels;

      await setDoc(ref, next as CatalogProduct);
      setImage(img);
      setImageFile(null);
      setImageMode("url");
      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save product.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!db || !user || !isAdmin) return;
    const ok = window.confirm(
      `Remove the Firestore document for “${catalogSlug}”? The storefront will fall back to code defaults if this slug exists in site.ts.`,
    );
    if (!ok) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "catalog_products", catalogSlug));
      router.push("/admin/catalog");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete product.";
      setError(msg);
    } finally {
      setDeleteBusy(false);
    }
  }

  const canUseFileUpload = Boolean(user && isAdmin && !profileLoading && storage);

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-sm text-[var(--lf-muted)]">Loading product…</div>
    );
  }

  if (loadState === "missing") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">No Firestore product</h2>
        <p className="text-sm text-[var(--lf-muted)]">
          There is no document at <code className="rounded bg-zinc-100 px-1 text-xs">catalog_products/{catalogSlug}</code>
          . Code-only pieces are edited in <code className="rounded bg-zinc-100 px-1 text-xs">src/lib/site.ts</code>. To
          add a new Firestore row (including an override for an existing code slug), use{" "}
          <Link href="/admin/catalog/new" className="font-semibold text-[var(--lf-purple)] hover:underline">
            Add product
          </Link>
          .
        </p>
        <Link href="/admin/catalog" className="text-sm font-semibold text-[var(--lf-purple)] hover:underline">
          ← Catalogue list
        </Link>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-2xl space-y-8 ${error ? "pb-28 sm:pb-8" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Edit catalogue product</h2>
          <p className="mt-1 font-mono text-xs text-[var(--lf-muted)]">catalog_products/{catalogSlug}</p>
          <p className="mt-2 text-sm text-[var(--lf-muted)]">
            Update core fields, hero image, gallery URLs, and PDP copy. Saving merges with the existing Firestore document
            (including <code className="rounded bg-zinc-100 px-0.5 text-xs">sourceImage</code> from the add-product flow).
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link href="/admin/catalog" className="text-sm font-semibold text-[var(--lf-purple)] hover:underline">
            ← Catalogue list
          </Link>
          <Link href={`/shop/${catalogSlug}`} className="text-sm font-semibold text-zinc-500 hover:text-[var(--lf-ink)]">
            View PDP →
          </Link>
        </div>
      </div>

      {savedAt ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          Changes saved.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Slug (read-only)</span>
          <p className="mt-1.5 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 font-mono text-sm text-[var(--lf-ink)]">
            {catalogSlug}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ep-name">
            Name
          </label>
          <input id="ep-name" className={`${inputClass} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ep-tag">
            Collection / tag
          </label>
          <input id="ep-tag" className={`${inputClass} mt-1.5`} value={tag} onChange={(e) => setTag(e.target.value)} required />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ep-price">
            Price (₦, whole number)
          </label>
          <input
            id="ep-price"
            className={`${inputClass} mt-1.5`}
            inputMode="numeric"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            required
          />
        </div>

        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]"
            htmlFor="ep-compare-at"
          >
            Compare-at price (₦, optional)
          </label>
          <input
            id="ep-compare-at"
            className={`${inputClass} mt-1.5`}
            inputMode="numeric"
            value={compareAtStr}
            onChange={(e) => setCompareAtStr(e.target.value)}
            placeholder="Leave blank when not on sale"
          />
          <p className="mt-1 text-xs text-[var(--lf-muted)]">
            Must be strictly greater than the price above, or leave blank to clear a promo.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ep-lead">
            Lead time / fulfilment note
          </label>
          <textarea id="ep-lead" className={`${inputClass} mt-1.5 min-h-[88px] resize-y`} value={lead} onChange={(e) => setLead(e.target.value)} required />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ep-desc">
            Description
          </label>
          <textarea
            id="ep-desc"
            className={`${inputClass} mt-1.5 min-h-[140px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/40 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            Storefront product page
          </legend>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--lf-ink)]">
            <input
              type="checkbox"
              className="mt-1 accent-[var(--lf-purple-deep)]"
              checked={galleryControlled}
              onChange={(e) => setGalleryControlled(e.target.checked)}
            />
            <span>
              <span className="font-medium">Control gallery manually</span>
              <span className="mt-0.5 block text-xs font-normal text-[var(--lf-muted)]">
                When on, the list below (or an empty list) defines thumbnails—no auto lookbook filler. When off, the site
                pads the gallery the legacy way.
              </span>
            </span>
          </label>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ep-gallery-lines">
              Extra gallery image URLs (one https URL per line, max 6)
            </label>
            <textarea
              id="ep-gallery-lines"
              className={`${inputClass} mt-1.5 min-h-[100px] resize-y font-mono text-xs`}
              value={galleryLines}
              onChange={(e) => setGalleryLines(e.target.value)}
              disabled={!galleryControlled}
              placeholder="https://…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ep-colour-notes">
              Colours / fabric availability (optional)
            </label>
            <textarea
              id="ep-colour-notes"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={colourAvailabilityNotes}
              onChange={(e) => setColourAvailabilityNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ep-fitting">
              Fitting section (optional)
            </label>
            <textarea
              id="ep-fitting"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={fittingNotes}
              onChange={(e) => setFittingNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ep-fabric">
              Fabric & care (optional)
            </label>
            <textarea
              id="ep-fabric"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={fabricCareNotes}
              onChange={(e) => setFabricCareNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ep-shipping">
              Shipping & returns (optional)
            </label>
            <textarea
              id="ep-shipping"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ep-craft-body">
              Craft & fabric — main paragraph (optional)
            </label>
            <textarea
              id="ep-craft-body"
              className={`${inputClass} mt-1.5 min-h-[88px] resize-y`}
              value={craftFabricNotes}
              onChange={(e) => setCraftFabricNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ep-craft-labels">
              Craft & fabric — chip labels (optional)
            </label>
            <textarea
              id="ep-craft-labels"
              className={`${inputClass} mt-1.5 min-h-[56px] resize-y`}
              value={craftFabricLabelsInput}
              onChange={(e) => setCraftFabricLabelsInput(e.target.value)}
              placeholder="Comma or newline separated"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Product image</legend>
          <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-[var(--lf-ink)]">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="ep-image-mode"
                className="accent-[var(--lf-purple-deep)]"
                checked={imageMode === "url"}
                onChange={() => setImageMode("url")}
              />
              Paste image URL
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="ep-image-mode"
                className="accent-[var(--lf-purple-deep)]"
                checked={imageMode === "file"}
                onChange={() => setImageMode("file")}
              />
              Upload new file
            </label>
          </div>

          {imageMode === "url" ? (
            <div className="pt-1">
              <label className="sr-only" htmlFor="ep-image">
                Image URL (https)
              </label>
              <input
                id="ep-image"
                className={inputClass}
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://…"
                required
              />
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {!canUseFileUpload ? (
                <p className="text-sm text-[var(--lf-muted)]">
                  {profileLoading
                    ? "Loading your session…"
                    : !storage
                      ? "Firebase Storage is not configured."
                      : "Sign in as an admin to upload images."}
                </p>
              ) : (
                <>
                  <p className="text-xs text-[var(--lf-muted)]">Leave file empty to keep the current image URL on save.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:bg-white">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setImageFile(f);
                          e.target.value = "";
                        }}
                      />
                      Choose file
                    </label>
                    {imageFile ? <span className="text-sm text-[var(--lf-muted)]">{imageFile.name}</span> : null}
                    {imageFile ? (
                      <button
                        type="button"
                        className="text-sm font-semibold text-[var(--lf-purple)] hover:underline"
                        onClick={() => setImageFile(null)}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  {filePreviewUrl ? (
                    <div className="relative h-40 w-full max-w-xs overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                      <Image
                        src={filePreviewUrl}
                        alt=""
                        width={320}
                        height={160}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )}
        </fieldset>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy || (imageMode === "file" && !imageFile && !image.trim().startsWith("https://"))}
            className="rounded-full bg-[var(--lf-purple-deep)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            disabled={deleteBusy}
            onClick={() => void onDelete()}
            className="rounded-full border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50"
          >
            {deleteBusy ? "Removing…" : "Remove Firestore row"}
          </button>
        </div>
      </form>

      <AdminFormErrorBanner message={error} onDismiss={() => setError(null)} />
    </div>
  );
}

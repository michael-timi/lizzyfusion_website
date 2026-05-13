"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import type { CatalogProduct } from "@/lib/catalog";
import { uploadCatalogProductHeroImage } from "@/lib/catalog-product-image-upload";
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
  const [lead, setLead] = useState("");
  const [description, setDescription] = useState("");
  const [imageMode, setImageMode] = useState<ImageMode>("url");
  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

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
        setLead(typeof data.lead === "string" ? data.lead : "");
        setDescription(typeof data.description === "string" ? data.description : "");
        setImage(typeof data.image === "string" ? data.image : "");
        setImageMode("url");
        setImageFile(null);
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

      const payload: CatalogProduct = {
        slug: catalogSlug,
        name: name.trim(),
        tag: tag.trim(),
        price,
        lead: lead.trim(),
        description: description.trim(),
        image: img,
      };

      await setDoc(doc(db, "catalog_products", catalogSlug), payload);
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
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Edit catalogue product</h2>
          <p className="mt-1 font-mono text-xs text-[var(--lf-muted)]">catalog_products/{catalogSlug}</p>
          <p className="mt-2 text-sm text-[var(--lf-muted)]">
            Slug and document id stay fixed. Update copy, price, or image; matching storefront PDP refreshes on next
            request.
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

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
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
    </div>
  );
}

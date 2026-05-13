"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { CatalogProduct } from "@/lib/catalog";
import { deleteCatalogProductHeroImage, uploadCatalogProductHeroImage } from "@/lib/catalog-product-image-upload";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { getFirebaseDb } from "@/lib/firebase-db";
import { getFirebaseStorage } from "@/lib/firebase-storage";

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

const inputClass = "input";

type ImageMode = "url" | "file";

export function AdminAddProductView() {
  const db = useMemo(() => getFirebaseDb(), []);
  const storage = useMemo(() => getFirebaseStorage(), []);
  const { user, isAdmin, profileLoading } = useFirebaseAuth();

  const [slug, setSlug] = useState("");
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
  const [error, setError] = useState<string | null>(null);
  const [doneSlug, setDoneSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    queueMicrotask(() => setFilePreviewUrl(url));
    return () => {
      URL.revokeObjectURL(url);
      queueMicrotask(() => setFilePreviewUrl(null));
    };
  }, [imageFile]);

  const suggestSlug = useCallback(() => {
    const s = slugify(name);
    if (s) setSlug(s);
  }, [name]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDoneSlug(null);
    if (!db) {
      setError("Firestore is not available in this browser session.");
      return;
    }
    if (!user || !isAdmin || profileLoading) {
      setError("You must be signed in as an admin to publish catalogue products.");
      return;
    }

    const s = slugify(slug || name);
    if (!s || s.length < 2) {
      setError("Enter a valid slug (letters, numbers, hyphens) or a product name to derive one.");
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

    let img = "";
    if (imageMode === "url") {
      img = image.trim();
      if (!img.startsWith("https://")) {
        setError("Image URL must start with https://");
        return;
      }
    } else {
      if (!imageFile) {
        setError("Choose an image file or switch to “Paste image URL”.");
        return;
      }
      if (!storage) {
        setError("Firebase Storage is not configured (check storageBucket in your web app config).");
        return;
      }
    }

    setBusy(true);
    let uploadedPath: string | null = null;
    try {
      const ref = doc(db, "catalog_products", s);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        setError(`A product with slug “${s}” already exists. Pick another slug or edit the existing document.`);
        return;
      }

      if (imageMode === "file" && imageFile && storage) {
        const { downloadUrl, storagePath } = await uploadCatalogProductHeroImage(storage, user.uid, s, imageFile);
        uploadedPath = storagePath;
        img = downloadUrl;
      }

      const payload: CatalogProduct = {
        slug: s,
        name: name.trim(),
        tag: tag.trim(),
        price,
        lead: lead.trim(),
        description: description.trim(),
        image: img,
      };

      await setDoc(ref, payload);
      setDoneSlug(s);
      setSlug("");
      setName("");
      setTag("");
      setPriceStr("");
      setLead("");
      setDescription("");
      setImage("");
      setImageFile(null);
      setImageMode("url");
    } catch (err) {
      if (uploadedPath && storage) {
        try {
          await deleteCatalogProductHeroImage(storage, uploadedPath);
        } catch {
          /* best-effort cleanup */
        }
      }
      const msg = err instanceof Error ? err.message : "Could not save product.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const canUseFileUpload = Boolean(user && isAdmin && !profileLoading && storage);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Add catalogue product</h2>
          <p className="mt-1 text-sm text-[var(--lf-muted)]">
            Creates a row in Firestore <code className="rounded bg-zinc-100 px-1 text-xs">catalog_products</code>{" "}
            (document id = slug). The storefront merges these with code defaults; matching slugs are overridden by
            Firestore.
          </p>
        </div>
        <Link href="/admin/catalog" className="text-sm font-semibold text-[var(--lf-purple)] hover:underline">
          ← Catalogue list
        </Link>
      </div>

      {doneSlug ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">Saved “{doneSlug}”.</p>
          <p className="mt-1 text-emerald-800/90">
            <Link href={`/shop/${doneSlug}`} className="font-semibold underline underline-offset-2">
              View on storefront
            </Link>
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ap-slug">
            Slug (URL)
          </label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <input
              id="ap-slug"
              className={inputClass}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. studio-wrap-dress"
              autoComplete="off"
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:bg-white"
              onClick={suggestSlug}
            >
              Derive from name
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--lf-muted)]">Lowercase, hyphens; becomes /shop/[slug] and the Firestore document id.</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ap-name">
            Name
          </label>
          <input id="ap-name" className={`${inputClass} mt-1.5`} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ap-tag">
            Collection / tag
          </label>
          <input id="ap-tag" className={`${inputClass} mt-1.5`} value={tag} onChange={(e) => setTag(e.target.value)} required />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ap-price">
            Price (₦, whole number)
          </label>
          <input
            id="ap-price"
            className={`${inputClass} mt-1.5`}
            inputMode="numeric"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="85000"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ap-lead">
            Lead time / fulfilment note
          </label>
          <textarea id="ap-lead" className={`${inputClass} mt-1.5 min-h-[88px] resize-y`} value={lead} onChange={(e) => setLead(e.target.value)} required />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="ap-desc">
            Description
          </label>
          <textarea
            id="ap-desc"
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
                name="ap-image-mode"
                className="accent-[var(--lf-purple-deep)]"
                checked={imageMode === "url"}
                onChange={() => setImageMode("url")}
              />
              Paste image URL
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="ap-image-mode"
                className="accent-[var(--lf-purple-deep)]"
                checked={imageMode === "file"}
                onChange={() => setImageMode("file")}
              />
              Upload file
            </label>
          </div>

          {imageMode === "url" ? (
            <div className="pt-1">
              <label className="sr-only" htmlFor="ap-image">
                Image URL (https)
              </label>
              <input
                id="ap-image"
                className={inputClass}
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://…"
                required
              />
              <p className="mt-1 text-xs text-[var(--lf-muted)]">Must be a direct https image link (e.g. Unsplash).</p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {!canUseFileUpload ? (
                <p className="text-sm text-[var(--lf-muted)]">
                  {profileLoading
                    ? "Loading your session…"
                    : !storage
                      ? "Firebase Storage is not available in this build. Add storageBucket to your client Firebase config."
                      : "Sign in as an admin to upload images."}
                </p>
              ) : (
                <>
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
                    {imageFile ? (
                      <span className="text-sm text-[var(--lf-muted)]">{imageFile.name}</span>
                    ) : (
                      <span className="text-sm text-[var(--lf-muted)]">JPEG, PNG, WebP — max 5 MB</span>
                    )}
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
            disabled={busy || (imageMode === "file" && (!canUseFileUpload || !imageFile))}
            className="rounded-full bg-[var(--lf-purple-deep)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Publish to catalogue"}
          </button>
        </div>
      </form>
    </div>
  );
}

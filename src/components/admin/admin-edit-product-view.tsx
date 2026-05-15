"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import type { CatalogProduct } from "@/lib/catalog";
import { AdminCatalogGalleryFields, mergeGalleryUrls } from "@/components/admin/admin-catalog-gallery-fields";
import {
  AdminStyleVariantsFields,
  styleDraftsFromSuggestVariants,
  styleVariantsFromFirestore,
  type StyleVariantDraft,
} from "@/components/admin/admin-style-variants-fields";
import type { CatalogSuggestFromHero } from "@/lib/gemini-catalog-suggest-from-hero";
import { buildStyleVariantsForSave, catalogDocForFirestore, uploadGalleryFiles } from "@/lib/admin-catalog-save-helpers";
import { uploadCatalogProductHeroImage } from "@/lib/catalog-product-image-upload";
import {
  AdminGalleryStyleLinks,
  galleryStyleLinksToRecord,
  resolveGalleryStyleLinksForSave,
} from "@/components/admin/admin-gallery-style-links";
import { type CatalogStyleVariant, withListingPriceFromVariants } from "@/lib/catalog-style-variants";
import { AdminFormBusyOverlay } from "@/components/admin/admin-form-busy-overlay";
import { AdminFormErrorBanner } from "@/components/admin/admin-form-error-banner";
import { adminFormFeedbackPadding } from "@/components/admin/admin-form-feedback";
import { AdminFormSuccessBanner } from "@/components/admin/admin-form-success-banner";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { requestCatalogRevalidation } from "@/lib/catalog-revalidate-client";
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
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [galleryUrlLines, setGalleryUrlLines] = useState("");
  const [stylesEnabled, setStylesEnabled] = useState(false);
  const [styleDrafts, setStyleDrafts] = useState<StyleVariantDraft[]>(() =>
    styleVariantsFromFirestore(undefined),
  );
  const [galleryStyleLinksByUrl, setGalleryStyleLinksByUrl] = useState<Record<string, string[]>>({});
  const [fittingNotes, setFittingNotes] = useState("");
  const [fabricCareNotes, setFabricCareNotes] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [craftFabricNotes, setCraftFabricNotes] = useState("");
  const [craftFabricLabelsInput, setCraftFabricLabelsInput] = useState("");
  const [colourAvailabilityNotes, setColourAvailabilityNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestAppliedAt, setSuggestAppliedAt] = useState<number | null>(null);
  const lastSuggestedHeroKeyRef = useRef<string | null>(null);
  const heroSuggestEpochRef = useRef(0);
  const filePreviewUrlRef = useRef<string | null>(null);
  const stylesEnabledRef = useRef(stylesEnabled);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    queueMicrotask(() => {
      setFilePreviewUrl(url);
      filePreviewUrlRef.current = url;
    });
    return () => {
      URL.revokeObjectURL(url);
      queueMicrotask(() => {
        setFilePreviewUrl(null);
        filePreviewUrlRef.current = null;
      });
    };
  }, [imageFile]);

  useEffect(() => {
    stylesEnabledRef.current = stylesEnabled;
  }, [stylesEnabled]);

  const linkableImageUrls = useMemo(() => {
    const urls: string[] = [];
    const push = (u: string | null | undefined) => {
      if (u && u.length > 10 && !urls.includes(u)) urls.push(u);
    };
    if (imageMode === "file" && filePreviewUrl) push(filePreviewUrl);
    else if (image.trim().startsWith("https://")) push(image.trim());
    if (galleryControlled) {
      for (const u of existingGalleryUrls) push(u);
      for (const line of galleryUrlLines.split("\n")) {
        const t = line.trim();
        if (t.startsWith("https://")) push(t);
      }
    }
    return urls.slice(0, 6);
  }, [imageMode, filePreviewUrl, image, galleryControlled, existingGalleryUrls, galleryUrlLines]);

  const applySuggestions = useCallback((s: CatalogSuggestFromHero) => {
    setName(s.name);
    setTag(s.tag);
    setLead(s.lead);
    setDescription(s.description);
    setFittingNotes(s.fittingNotes ?? "");
    setFabricCareNotes(s.fabricCareNotes ?? "");
    setShippingNotes(s.shippingNotes ?? "");
    setCraftFabricNotes(s.craftFabricNotes ?? "");
    setCraftFabricLabelsInput(s.craftFabricLabels?.join(", ") ?? "");
    setColourAvailabilityNotes(s.colourAvailabilityNotes ?? "");
    if (s.galleryRestrictNoLookbook) setGalleryControlled(true);

    const variants = s.suggestedStyleVariants;
    if (s.multiStyleRecommended && variants && variants.length > 0) {
      setStylesEnabled(true);
      setStyleDrafts(styleDraftsFromSuggestVariants(variants));
      setPriceStr("");
      setCompareAtStr("");
    } else if (!stylesEnabledRef.current) {
      setStylesEnabled(false);
      const listingPrice = variants?.length === 1 ? variants[0]!.priceNgn : s.priceNgn;
      setPriceStr(String(listingPrice));
      setCompareAtStr("");
    }

    const heroKey = filePreviewUrlRef.current;
    const visible = s.stylesVisibleInHero;
    if (heroKey && visible?.length) {
      setGalleryStyleLinksByUrl((prev) => ({ ...prev, [heroKey]: [...visible] }));
    } else if (heroKey && variants?.length === 1) {
      setGalleryStyleLinksByUrl((prev) => ({ ...prev, [heroKey]: [variants[0]!.id] }));
    }
  }, []);

  const suggestFromHero = useCallback(
    async (file: File, signal: AbortSignal | undefined, epoch: number) => {
      if (!user) return;
      setSuggestBusy(true);
      setError(null);
      try {
        const idToken = await user.getIdToken();
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch("/api/admin/catalog/suggest-from-hero", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: fd,
          signal,
        });
        if (signal?.aborted) return;
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          suggestions?: CatalogSuggestFromHero;
        };
        if (epoch !== heroSuggestEpochRef.current) return;
        if (!res.ok) {
          setError(body.error ?? `Suggestions failed (${res.status}).`);
          return;
        }
        if (!body.suggestions) {
          setError("No suggestions returned.");
          return;
        }
        applySuggestions(body.suggestions);
        lastSuggestedHeroKeyRef.current = `${file.name}-${file.size}-${file.lastModified}`;
        setSuggestAppliedAt(Date.now());
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        if (epoch !== heroSuggestEpochRef.current) return;
        setError(e instanceof Error ? e.message : "Could not fetch suggestions.");
      } finally {
        if (epoch === heroSuggestEpochRef.current) {
          setSuggestBusy(false);
        }
      }
    },
    [user, applySuggestions],
  );

  useEffect(() => {
    if (suggestAppliedAt === null) return;
    const tid = window.setTimeout(() => setSuggestAppliedAt(null), 6000);
    return () => window.clearTimeout(tid);
  }, [suggestAppliedAt]);

  useEffect(() => {
    if (imageMode !== "file" || !imageFile || !user || !isAdmin) {
      if (!imageFile) lastSuggestedHeroKeyRef.current = null;
      return;
    }
    const key = `${imageFile.name}-${imageFile.size}-${imageFile.lastModified}`;
    if (lastSuggestedHeroKeyRef.current === key) return;

    const epoch = heroSuggestEpochRef.current;
    const ac = new AbortController();
    const tid = window.setTimeout(() => {
      void suggestFromHero(imageFile, ac.signal, epoch);
    }, 500);
    return () => {
      window.clearTimeout(tid);
      ac.abort();
    };
  }, [imageFile, imageMode, user, isAdmin, suggestFromHero]);

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
        setExistingGalleryUrls(
          Array.isArray(data.galleryImageUrls) ? data.galleryImageUrls.filter((u) => typeof u === "string") : [],
        );
        setNewGalleryFiles([]);
        setGalleryUrlLines("");
        const hasStyles = Array.isArray(data.styleVariants) && data.styleVariants.length > 0;
        setStylesEnabled(hasStyles);
        setStyleDrafts(styleVariantsFromFirestore(data.styleVariants));
        setGalleryStyleLinksByUrl(galleryStyleLinksToRecord(data.galleryStyleLinks));
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

    let price = Math.round(Number(priceStr.replace(/,/g, "")));
    let compareAtPrice: number | undefined;
    if (!stylesEnabled) {
      if (!Number.isFinite(price) || price < 0) {
        setError("Price must be a non-negative number (stored as whole Naira).");
        return;
      }
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
    }

    if (!name.trim() || !tag.trim() || !lead.trim() || !description.trim()) {
      setError("Name, collection tag, lead time, and description are required.");
      return;
    }

    const nameT = name.trim();
    const tagT = tag.trim();
    const leadT = lead.trim();
    const descriptionT = description.trim();
    if (nameT.length >= 200) {
      setError("Product name must be under 200 characters (Firestore catalogue limit).");
      return;
    }
    if (tagT.length >= 120) {
      setError("Collection tag must be under 120 characters.");
      return;
    }
    if (leadT.length > 4000) {
      setError("Lead time / fulfilment copy must be at most 4,000 characters.");
      return;
    }
    if (descriptionT.length > 20_000) {
      setError("Description must be at most 20,000 characters.");
      return;
    }

    let img = image.trim();
    const heroPreviewForRemap = imageMode === "file" && filePreviewUrl ? filePreviewUrl : null;
    const previousHeroUrl = image.trim();
    setBusy(true);
    setSaveMessage(null);
    try {
      if (imageMode === "file" && imageFile && storage) {
        setSaveMessage("Uploading hero image…");
        const { downloadUrl } = await uploadCatalogProductHeroImage(storage, user.uid, catalogSlug, imageFile);
        img = downloadUrl;
      }

      if (!img.startsWith("https://")) {
        setError("Image must be an https URL (paste a link or upload a file).");
        return;
      }

      let styleVariants: CatalogStyleVariant[] | undefined;
      if (stylesEnabled) {
        if (!storage) {
          setError("Firebase Storage is required to save dress styles with photos.");
          return;
        }
        setSaveMessage("Uploading style photos…");
        styleVariants = await buildStyleVariantsForSave(styleDrafts, storage, user.uid, catalogSlug);
        price = Math.min(...styleVariants.map((v) => v.price));
        compareAtPrice = undefined;
      }

      setSaveMessage("Saving changes…");
      const ref = doc(db, "catalog_products", catalogSlug);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError("Product document disappeared. Reload the page.");
        return;
      }
      const prev = snap.data() as Record<string, unknown>;
      const next: Record<string, unknown> = { ...prev };

      next.slug = catalogSlug;
      next.name = nameT;
      next.tag = tagT;
      next.price = price;
      if (compareAtPrice !== undefined) next.compareAtPrice = compareAtPrice;
      else delete next.compareAtPrice;
      next.lead = leadT;
      next.description = descriptionT;
      next.image = img;

      if (galleryControlled && storage) {
        setSaveMessage("Uploading gallery images…");
        const uploaded = await uploadGalleryFiles(
          storage,
          user.uid,
          catalogSlug,
          newGalleryFiles,
          6,
          existingGalleryUrls.length,
        );
        const merged = mergeGalleryUrls(existingGalleryUrls, uploaded, galleryUrlLines);
        next.galleryImageUrls = merged ?? [];
        setExistingGalleryUrls(merged ?? []);
        setNewGalleryFiles([]);
        setGalleryUrlLines("");
      } else {
        delete next.galleryImageUrls;
        setExistingGalleryUrls([]);
      }

      if (styleVariants?.length) next.styleVariants = styleVariants;
      else delete next.styleVariants;

      const styleLinks = stylesEnabled
        ? resolveGalleryStyleLinksForSave(galleryStyleLinksByUrl, [
            ...(heroPreviewForRemap ? [{ from: heroPreviewForRemap, to: img }] : []),
          ])
        : undefined;
      if (styleLinks?.length) next.galleryStyleLinks = styleLinks;
      else delete next.galleryStyleLinks;

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

      const toSave = withListingPriceFromVariants(
        next as CatalogProduct,
        styleVariants,
        styleLinks,
      );
      await setDoc(ref, catalogDocForFirestore(toSave));
      setPriceStr(String(toSave.price));
      setSaveMessage("Updating storefront cache…");
      await requestCatalogRevalidation(user, catalogSlug);
      setImage(img);
      setImageFile(null);
      setImageMode("url");
      if (heroPreviewForRemap || (previousHeroUrl.startsWith("https://") && previousHeroUrl !== img)) {
        setGalleryStyleLinksByUrl((prev) => {
          const next = { ...prev };
          if (heroPreviewForRemap) {
            const ids = next[heroPreviewForRemap];
            delete next[heroPreviewForRemap];
            if (ids?.length) next[img] = ids;
          }
          if (previousHeroUrl.startsWith("https://") && previousHeroUrl !== img) {
            delete next[previousHeroUrl];
          }
          return next;
        });
      }
      setError(null);
      setSavedAt(Date.now());
      router.refresh();
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Could not save product.";
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        msg = `Firestore rejected this save (permission denied). If your profile is already admin, check field limits (name under 200 characters, tag under 120, lead at most 4,000, description at most 20,000, https image) and deploy the latest firestore.rules (npm run firebase:deploy:rules).`;
      }
      setError(msg);
    } finally {
      setBusy(false);
      setSaveMessage(null);
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
      await requestCatalogRevalidation(user, catalogSlug);
      router.push("/admin/catalog");
      router.refresh();
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Could not delete product.";
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        msg = `Firestore rejected delete (permission denied). Ensure users/${user?.uid ?? "YOUR_UID"} has userType exactly admin (lowercase) and deploy firestore.rules.`;
      }
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
          <Link href="/admin/catalog/add" className="font-semibold text-[var(--lf-purple)] hover:underline">
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
    <div className={`mx-auto max-w-2xl space-y-8 ${adminFormFeedbackPadding(Boolean(error || savedAt))}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Edit catalogue product</h2>
          <p className="mt-1 font-mono text-xs text-[var(--lf-muted)]">catalog_products/{catalogSlug}</p>
          <p className="mt-2 text-sm text-[var(--lf-muted)]">
            Update core fields, hero image, gallery URLs, and PDP copy. Uploading a new hero file triggers Gemini
            suggestions for copy, dress styles, and gallery style tags (review before saving). Saving merges with the
            existing Firestore document.
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

      <form
        onSubmit={onSubmit}
        className="relative space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <AdminFormBusyOverlay
          active={busy}
          title="Saving catalogue product"
          message={saveMessage ?? "Please keep this tab open…"}
        />
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

        {!stylesEnabled ? (
          <>
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
          </>
        ) : (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-[var(--lf-muted)]">
            Listing price on the shop is set automatically to the <strong className="font-medium text-[var(--lf-ink)]">lowest</strong> style
            price below.
          </p>
        )}

        <AdminStyleVariantsFields
          enabled={stylesEnabled}
          onEnabledChange={setStylesEnabled}
          drafts={styleDrafts}
          onDraftsChange={setStyleDrafts}
          disabled={busy || suggestBusy}
        />

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

          <AdminCatalogGalleryFields
            controlled={galleryControlled}
            onControlledChange={setGalleryControlled}
            existingUrls={existingGalleryUrls}
            onExistingUrlsChange={setExistingGalleryUrls}
            newFiles={newGalleryFiles}
            onNewFilesChange={setNewGalleryFiles}
            urlLines={galleryUrlLines}
            onUrlLinesChange={setGalleryUrlLines}
            disabled={busy}
            restrictLabel="Control gallery manually"
            restrictHelp="When on, uploads and URLs below define thumbnails—no auto lookbook filler. When off, the site pads the gallery the legacy way."
          />

          {stylesEnabled ? (
            <AdminGalleryStyleLinks
              imageUrls={linkableImageUrls}
              styleDrafts={styleDrafts}
              linksByUrl={galleryStyleLinksByUrl}
              onLinksChange={setGalleryStyleLinksByUrl}
              disabled={busy || suggestBusy}
            />
          ) : null}

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
          <p className="text-xs leading-relaxed text-[var(--lf-muted)]">
            Under <strong className="font-medium text-[var(--lf-ink)]">Upload new file</strong>, choosing a replacement hero
            drafts copy, dress styles, and gallery style tags from the photo (review before saving).
          </p>
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
                          if (!f) {
                            setImageFile(null);
                            lastSuggestedHeroKeyRef.current = null;
                            setSuggestAppliedAt(null);
                            e.target.value = "";
                            return;
                          }
                          if (!f.type.startsWith("image/")) {
                            setError("Hero must be an image file (JPEG, PNG, WebP, or GIF).");
                            e.target.value = "";
                            return;
                          }
                          if (f.size > 5 * 1024 * 1024) {
                            setError("Hero must be 5 MB or smaller.");
                            e.target.value = "";
                            return;
                          }
                          setError(null);
                          lastSuggestedHeroKeyRef.current = null;
                          heroSuggestEpochRef.current += 1;
                          setSuggestAppliedAt(null);
                          setImageFile(f);
                          e.target.value = "";
                        }}
                      />
                      Choose file
                    </label>
                    {imageFile ? (
                      <button
                        type="button"
                        disabled={suggestBusy}
                        onClick={() => {
                          lastSuggestedHeroKeyRef.current = null;
                          heroSuggestEpochRef.current += 1;
                          setSuggestAppliedAt(null);
                          void suggestFromHero(imageFile, undefined, heroSuggestEpochRef.current);
                        }}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {suggestBusy ? "Drafting…" : "Refresh AI suggestions"}
                      </button>
                    ) : null}
                    {imageFile ? (
                      <button
                        type="button"
                        className="text-sm font-semibold text-[var(--lf-purple)] hover:underline"
                        onClick={() => {
                          setImageFile(null);
                          lastSuggestedHeroKeyRef.current = null;
                          heroSuggestEpochRef.current += 1;
                          setSuggestAppliedAt(null);
                        }}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  {imageMode === "file" && suggestBusy ? (
                    <div
                      className="flex items-start gap-3 rounded-xl border border-[var(--lf-purple)]/30 bg-white px-4 py-3 shadow-sm"
                      role="status"
                      aria-live="polite"
                    >
                      <span
                        className="mt-0.5 inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[var(--lf-purple)] border-t-transparent"
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1 text-sm leading-snug text-[var(--lf-ink)]">
                        <p className="font-semibold">Drafting updates from your new hero…</p>
                        <p className="mt-0.5 text-xs text-[var(--lf-muted)]">
                          Gemini is refreshing copy, dress styles, and gallery tags. This usually takes 10–20 seconds.
                        </p>
                      </div>
                    </div>
                  ) : null}
                  {!suggestBusy && suggestAppliedAt !== null && imageMode === "file" ? (
                    <div
                      className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3"
                      role="status"
                      aria-live="polite"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white"
                      >
                        ✓
                      </span>
                      <div className="min-w-0 flex-1 text-sm leading-snug text-emerald-900">
                        <p className="font-semibold">Suggestions applied — review fields above before saving.</p>
                        <p className="mt-0.5 text-xs text-emerald-800/90">
                          Copy, dress styles, and photo style tags are editable. Existing multi-style rows are kept unless
                          Gemini recommended new styles.
                        </p>
                      </div>
                    </div>
                  ) : null}
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

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
          <button
            type="submit"
            disabled={busy || deleteBusy || (imageMode === "file" && !imageFile && !image.trim().startsWith("https://"))}
            className="rounded-full bg-[var(--lf-purple-deep)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            disabled={busy || deleteBusy}
            onClick={() => void onDelete()}
            className="rounded-full border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50"
          >
            {deleteBusy ? "Removing…" : "Remove Firestore row"}
          </button>
          {busy ? (
            <p className="text-xs text-[var(--lf-muted)]" aria-live="polite">
              {saveMessage ?? "Working…"}
            </p>
          ) : null}
        </div>
      </form>

      {savedAt ? (
        <AdminFormSuccessBanner
          title="Changes saved"
          action={{ href: `/shop/${catalogSlug}`, label: "View on storefront" }}
          onDismiss={() => setSavedAt(null)}
        >
          The catalogue and storefront cache have been updated.
        </AdminFormSuccessBanner>
      ) : null}

      <AdminFormErrorBanner message={error} onDismiss={() => setError(null)} />
    </div>
  );
}

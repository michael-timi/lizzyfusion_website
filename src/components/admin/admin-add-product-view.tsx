"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { CatalogProduct } from "@/lib/catalog";
import {
  deleteCatalogProductHeroImage,
  uploadCatalogProductGalleryImage,
  uploadCatalogProductHeroImage,
  uploadCatalogProductSourceImage,
} from "@/lib/catalog-product-image-upload";
import type {
  CameraAngle,
  DressCategory,
  GarmentAudience,
  MannequinStyle,
  PositionStyle,
  StudioBackground,
  StudioLighting,
} from "@/lib/gemini-catalog-hero";
import type { CatalogSuggestFromHero } from "@/lib/gemini-catalog-suggest-from-hero";
import { AdminFormErrorBanner } from "@/components/admin/admin-form-error-banner";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { requestCatalogRevalidation } from "@/lib/catalog-revalidate-client";
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

const dressCategoryOptions: Array<{ value: DressCategory; label: string }> = [
  { value: "auto", label: "Auto detect" },
  { value: "evening-gown", label: "Evening gown" },
  { value: "cocktail-dress", label: "Cocktail dress" },
  { value: "bridal-dress", label: "Bridal dress" },
  { value: "casual-dress", label: "Casual dress" },
  { value: "maxi-dress", label: "Maxi dress" },
  { value: "midi-dress", label: "Midi dress" },
  { value: "mini-dress", label: "Mini dress" },
  { value: "kaftan", label: "Kaftan" },
  { value: "aso-ebi", label: "Aso-ebi / occasion wear" },
];

const mannequinStyleOptions: Array<{ value: MannequinStyle; label: string }> = [
  { value: "auto-varied", label: "Auto vary each generation" },
  { value: "cream-female", label: "Cream female mannequin" },
  { value: "headless-white", label: "Headless white mannequin" },
  { value: "matte-black", label: "Matte black mannequin" },
  { value: "wooden-dress-form", label: "Wooden dress form" },
];

const positionStyleOptions: Array<{ value: PositionStyle; label: string }> = [
  { value: "auto-varied", label: "Auto vary each generation" },
  { value: "classic-straight", label: "Classic straight stance" },
  { value: "soft-contrapposto", label: "Soft fashion pose" },
  { value: "runway-step", label: "Subtle runway step" },
  { value: "arms-away", label: "Arms away from body" },
  { value: "atelier-display", label: "Atelier display form" },
];

const backgroundOptions: Array<{ value: StudioBackground; label: string }> = [
  { value: "soft-grey", label: "Soft grey studio" },
  { value: "pure-white", label: "Pure white ecommerce" },
  { value: "luxury-boutique", label: "Luxury boutique" },
  { value: "sunlit-atelier", label: "Sunlit atelier" },
];

const lightingOptions: Array<{ value: StudioLighting; label: string }> = [
  { value: "softbox", label: "Soft studio light" },
  { value: "editorial", label: "Editorial lookbook" },
  { value: "natural-daylight", label: "Natural daylight" },
];

const cameraAngleOptions: Array<{ value: CameraAngle; label: string }> = [
  { value: "front", label: "Front-facing" },
  { value: "three-quarter", label: "Slight angle" },
];

function base64ToImageFile(b64: string, mime: string, filename: string): File {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const ab = new ArrayBuffer(arr.byteLength);
  new Uint8Array(ab).set(arr);
  const blob = new Blob([ab], { type: mime });
  return new File([blob], filename, { type: mime });
}

function imageFileExtension(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "png";
}

export function AdminAddProductView() {
  const router = useRouter();
  const db = useMemo(() => getFirebaseDb(), []);
  const storage = useMemo(() => getFirebaseStorage(), []);
  const { user, isAdmin, profileLoading } = useFirebaseAuth();

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [compareAtStr, setCompareAtStr] = useState("");
  const [lead, setLead] = useState("");
  const [description, setDescription] = useState("");

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryRestrictNoLookbook, setGalleryRestrictNoLookbook] = useState(true);
  const [fittingNotes, setFittingNotes] = useState("");
  const [fabricCareNotes, setFabricCareNotes] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [craftFabricNotes, setCraftFabricNotes] = useState("");
  const [craftFabricLabelsInput, setCraftFabricLabelsInput] = useState("");
  const [colourAvailabilityNotes, setColourAvailabilityNotes] = useState("");

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [garmentAudience, setGarmentAudience] = useState<GarmentAudience>("unspecified");
  const [dressCategory, setDressCategory] = useState<DressCategory>("auto");
  const [mannequinStyle, setMannequinStyle] = useState<MannequinStyle>("auto-varied");
  const [positionStyle, setPositionStyle] = useState<PositionStyle>("auto-varied");
  const [background, setBackground] = useState<StudioBackground>("soft-grey");
  const [lighting, setLighting] = useState<StudioLighting>("softbox");
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>("front");
  const [heroNotes, setHeroNotes] = useState("");
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string | null>(null);

  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestAppliedAt, setSuggestAppliedAt] = useState<number | null>(null);
  const lastSuggestedHeroKeyRef = useRef<string | null>(null);
  const heroSuggestEpochRef = useRef(0);

  const [geminiBusy, setGeminiBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneSlug, setDoneSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceFile) return;
    const url = URL.createObjectURL(sourceFile);
    queueMicrotask(() => setSourcePreviewUrl(url));
    return () => {
      URL.revokeObjectURL(url);
      queueMicrotask(() => setSourcePreviewUrl(null));
    };
  }, [sourceFile]);

  useEffect(() => {
    if (!heroFile) return;
    const url = URL.createObjectURL(heroFile);
    queueMicrotask(() => setHeroPreviewUrl(url));
    return () => {
      URL.revokeObjectURL(url);
      queueMicrotask(() => setHeroPreviewUrl(null));
    };
  }, [heroFile]);

  const suggestSlug = useCallback(() => {
    const s = slugify(name);
    if (s) setSlug(s);
  }, [name]);

  const applySuggestions = useCallback((s: CatalogSuggestFromHero) => {
    setSlug(s.slug);
    setName(s.name);
    setTag(s.tag);
    setPriceStr(String(s.priceNgn));
    setCompareAtStr("");
    setLead(s.lead);
    setDescription(s.description);
    setFittingNotes(s.fittingNotes ?? "");
    setFabricCareNotes(s.fabricCareNotes ?? "");
    setShippingNotes(s.shippingNotes ?? "");
    setCraftFabricNotes(s.craftFabricNotes ?? "");
    setCraftFabricLabelsInput(s.craftFabricLabels?.join(", ") ?? "");
    setColourAvailabilityNotes(s.colourAvailabilityNotes ?? "");
    setGarmentAudience(s.garmentAudience);
    setDressCategory(s.dressCategory);
    setMannequinStyle(s.mannequinStyle);
    setPositionStyle(s.positionStyle);
    setBackground(s.background);
    setLighting(s.lighting);
    setCameraAngle(s.cameraAngle);
    setGalleryRestrictNoLookbook(s.galleryRestrictNoLookbook);
    setHeroNotes(s.heroNotes ?? "");
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
    if (!heroFile || !user || !isAdmin) {
      if (!heroFile) lastSuggestedHeroKeyRef.current = null;
      return;
    }
    const key = `${heroFile.name}-${heroFile.size}-${heroFile.lastModified}`;
    if (lastSuggestedHeroKeyRef.current === key) return;

    const epoch = heroSuggestEpochRef.current;
    const ac = new AbortController();
    const tid = window.setTimeout(() => {
      void suggestFromHero(heroFile, ac.signal, epoch);
    }, 500);
    return () => {
      window.clearTimeout(tid);
      ac.abort();
    };
  }, [heroFile, user, isAdmin, suggestFromHero]);

  async function generateCatalogHero() {
    setError(null);
    if (!user) {
      setError("Sign in to generate images.");
      return;
    }
    if (!sourceFile) {
      setError("Upload the original garment photo first.");
      return;
    }
    setGeminiBusy(true);
    try {
      const idToken = await user.getIdToken();
      const fd = new FormData();
      fd.append("image", sourceFile);
      fd.append("audience", garmentAudience);
      fd.append("dressCategory", dressCategory);
      fd.append("mannequinStyle", mannequinStyle);
      fd.append("positionStyle", positionStyle);
      fd.append("background", background);
      fd.append("lighting", lighting);
      fd.append("cameraAngle", cameraAngle);
      if (heroNotes.trim()) fd.append("notes", heroNotes.trim());

      const res = await fetch("/api/admin/catalog/hero-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: fd,
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; imageBase64?: string; mimeType?: string };
      if (!res.ok) {
        setError(body.error ?? `Generation failed (${res.status}).`);
        return;
      }
      if (!body.imageBase64) {
        setError("Server returned no image data.");
        return;
      }
      const mime = body.mimeType?.startsWith("image/") ? body.mimeType : "image/png";
      const hero = base64ToImageFile(body.imageBase64, mime, "catalog-hero.png");
      lastSuggestedHeroKeyRef.current = null;
      heroSuggestEpochRef.current += 1;
      setHeroFile(hero);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error while generating.");
    } finally {
      setGeminiBusy(false);
    }
  }

  function downloadGeneratedHero() {
    if (!heroFile || !heroPreviewUrl) return;
    const a = document.createElement("a");
    a.href = heroPreviewUrl;
    a.download = `${slugify(slug || name || "lizzy-fusion-dress-hero")}.${imageFileExtension(heroFile.type)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

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

    if (!storage) {
      setError("Firebase Storage is not configured (check storageBucket in your web app config).");
      return;
    }
    if (!heroFile) {
      setError("Upload the Lizzy Fusion mannequin hero image at the top of the form.");
      return;
    }

    const leadT = lead.trim();
    const descriptionT = description.trim();
    const nameT = name.trim();
    const tagT = tag.trim();
    if (nameT.length >= 200) {
      setError("Product name must be under 200 characters (Firestore catalogue limit). Shorten the name and try again.");
      return;
    }
    if (tagT.length >= 120) {
      setError("Collection tag must be under 120 characters. Shorten the tag and try again.");
      return;
    }
    if (leadT.length > 4000) {
      setError("Lead time / fulfilment copy must be at most 4,000 characters. Shorten the lead field and try again.");
      return;
    }
    if (descriptionT.length > 20_000) {
      setError("Description must be at most 20,000 characters. Shorten the description and try again.");
      return;
    }

    setBusy(true);
    let sourcePath: string | null = null;
    let heroPath: string | null = null;
    const galleryPaths: string[] = [];
    let cataloguePayloadForDebug: CatalogProduct | undefined;
    try {
      const ref = doc(db, "catalog_products", s);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        setError(`A product with slug “${s}” already exists. Pick another slug or edit the existing document.`);
        return;
      }

      let sourceUp: { downloadUrl: string; storagePath: string } | null = null;
      if (sourceFile) {
        sourceUp = await uploadCatalogProductSourceImage(storage, user.uid, s, sourceFile);
        sourcePath = sourceUp.storagePath;
      }

      const heroUp = await uploadCatalogProductHeroImage(storage, user.uid, s, heroFile);
      heroPath = heroUp.storagePath;

      const galleryUrls: string[] = [];
      for (const f of galleryFiles.slice(0, 6)) {
        const g = await uploadCatalogProductGalleryImage(storage, user.uid, s, f);
        galleryPaths.push(g.storagePath);
        galleryUrls.push(g.downloadUrl);
      }

      let galleryImageUrls: string[] | undefined;
      if (galleryUrls.length > 0) galleryImageUrls = galleryUrls;
      else if (galleryRestrictNoLookbook) galleryImageUrls = [];

      const craftFabricLabels = craftFabricLabelsInput
        .split(/[\n,]+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 8);

      const payload: CatalogProduct = {
        slug: s,
        name: nameT,
        tag: tagT,
        price,
        ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
        lead: leadT,
        description: descriptionT,
        image: heroUp.downloadUrl,
        ...(sourceUp ? { sourceImage: sourceUp.downloadUrl } : {}),
        ...(galleryImageUrls !== undefined ? { galleryImageUrls } : {}),
        ...(fittingNotes.trim() ? { fittingNotes: fittingNotes.trim() } : {}),
        ...(fabricCareNotes.trim() ? { fabricCareNotes: fabricCareNotes.trim() } : {}),
        ...(shippingNotes.trim() ? { shippingNotes: shippingNotes.trim() } : {}),
        ...(craftFabricNotes.trim() ? { craftFabricNotes: craftFabricNotes.trim() } : {}),
        ...(craftFabricLabels.length ? { craftFabricLabels } : {}),
        ...(colourAvailabilityNotes.trim() ? { colourAvailabilityNotes: colourAvailabilityNotes.trim() } : {}),
      };

      cataloguePayloadForDebug = payload;
      await setDoc(ref, payload);
      // Invalidate the storefront catalogue cache so the "View on storefront" link below works
      // immediately instead of 404'ing until the unstable_cache TTL expires.
      await requestCatalogRevalidation(user, s);
      router.refresh();
      setDoneSlug(s);
      setSlug("");
      setName("");
      setTag("");
      setPriceStr("");
      setCompareAtStr("");
      setLead("");
      setDescription("");
      setSourceFile(null);
      setHeroFile(null);
      setHeroNotes("");
      setGarmentAudience("unspecified");
      setDressCategory("auto");
      setMannequinStyle("auto-varied");
      setPositionStyle("auto-varied");
      setBackground("soft-grey");
      setLighting("softbox");
      setCameraAngle("front");
      setGalleryFiles([]);
      setGalleryRestrictNoLookbook(true);
      setFittingNotes("");
      setFabricCareNotes("");
      setShippingNotes("");
      setCraftFabricNotes("");
      setCraftFabricLabelsInput("");
      setColourAvailabilityNotes("");
      setSuggestAppliedAt(null);
    } catch (err) {
      const payloadSummary = cataloguePayloadForDebug && {
        slug: cataloguePayloadForDebug.slug,
        price: cataloguePayloadForDebug.price,
        compareAtPrice: cataloguePayloadForDebug.compareAtPrice,
        fieldKeys: Object.keys(cataloguePayloadForDebug),
        heroImageUrlLength: cataloguePayloadForDebug.image?.length,
        heroImageUrlPrefix: cataloguePayloadForDebug.image?.slice(0, 48),
      };
      const firebaseMeta =
        err instanceof FirebaseError
          ? { firebaseCode: err.code, firebaseMessage: err.message }
          : {};
      console.error("[admin/catalog/add] publish failed", { slug: s, uid: user?.uid, payloadSummary, ...firebaseMeta }, err);
      for (const p of galleryPaths) {
        if (storage) {
          try {
            await deleteCatalogProductHeroImage(storage, p);
          } catch {
            /* best-effort */
          }
        }
      }
      if (heroPath && storage) {
        try {
          await deleteCatalogProductHeroImage(storage, heroPath);
        } catch {
          /* best-effort */
        }
      }
      if (sourcePath && storage) {
        try {
          await deleteCatalogProductHeroImage(storage, sourcePath);
        } catch {
          /* best-effort */
        }
      }
      let msg = err instanceof Error ? err.message : "Could not save product.";
      if (err instanceof FirebaseError && err.code === "permission-denied") {
        msg = `Firestore rejected this save (permission denied). If users/${user?.uid ?? "YOUR_UID"} already has userType admin, the payload likely failed catalogue validation (e.g. name/tag/lead/description length limits, https image URL). Deploy the latest firestore.rules (npm run firebase:deploy:rules).`;
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const canUseStorage = Boolean(user && isAdmin && !profileLoading && storage);
  const canPublish = Boolean(heroFile && canUseStorage);

  return (
    <div className={`mx-auto max-w-2xl space-y-8 ${error ? "pb-28 sm:pb-8" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Add catalogue product</h2>
          <p className="mt-1 text-sm text-[var(--lf-muted)]">
            Start with your <strong className="font-medium text-[var(--lf-ink)]">Lizzy Fusion mannequin hero</strong> image.
            After upload, Gemini suggests catalogue copy tuned for Nigerian modest occasion wear (you can edit everything).
            Optionally add an <strong className="font-medium text-[var(--lf-ink)]">original garment</strong> photo in Advanced
            if you still want a separate <code className="rounded bg-zinc-100 px-1 text-xs">sourceImage</code> on the PDP.
          </p>
          <p className="mt-2 text-xs text-[var(--lf-muted)]">
            Server needs <code className="rounded bg-zinc-100 px-0.5 text-[11px]">GEMINI_API_KEY</code> for suggestions and
            optional hero generation; Storage for uploads.
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

      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <fieldset className="space-y-3 rounded-xl border border-zinc-200 bg-[var(--lf-purple-faint)]/40 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            1. Mannequin hero (required)
          </legend>
          <p className="text-xs leading-relaxed text-[var(--lf-muted)]">
            Upload the final Lizzy Fusion catalogue image (dress on mannequin / dress form). Gemini reads it and suggests
            slug, price in Naira, PDP copy, and studio controls below—always review before publishing.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer rounded-full bg-[var(--lf-purple-deep)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (!f) {
                    setHeroFile(null);
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
                  setHeroFile(f);
                  e.target.value = "";
                }}
              />
              Choose hero image
            </label>
            {heroFile ? (
              <button
                type="button"
                disabled={suggestBusy}
                onClick={() => {
                  lastSuggestedHeroKeyRef.current = null;
                  heroSuggestEpochRef.current += 1;
                  setSuggestAppliedAt(null);
                  void suggestFromHero(heroFile, undefined, heroSuggestEpochRef.current);
                }}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-200"
              >
                {suggestBusy ? "Drafting…" : "Refresh AI suggestions"}
              </button>
            ) : null}
            {heroFile ? (
              <button
                type="button"
                className="text-xs font-semibold text-[var(--lf-purple)] hover:underline"
                onClick={() => {
                  setHeroFile(null);
                  lastSuggestedHeroKeyRef.current = null;
                  heroSuggestEpochRef.current += 1;
                  setSuggestAppliedAt(null);
                }}
              >
                Clear hero
              </button>
            ) : null}
          </div>
          {suggestBusy ? (
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
                <p className="font-semibold">Drafting product details from your hero…</p>
                <p className="mt-0.5 text-xs text-[var(--lf-muted)]">
                  Gemini is suggesting the slug, name, price, PDP copy and studio controls below. This usually takes
                  10–20 seconds — please leave those fields alone until they fill in, then review and edit anything
                  before publishing.
                </p>
              </div>
            </div>
          ) : null}
          {!suggestBusy && suggestAppliedAt !== null ? (
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
                <p className="font-semibold">Suggestions applied — review and edit below before publishing.</p>
                <p className="mt-0.5 text-xs text-emerald-800/90">
                  Everything Gemini drafted is fully editable. Use “Refresh AI suggestions” to try again if anything
                  looks off.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSuggestAppliedAt(null)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-800 underline-offset-2 hover:bg-emerald-100 hover:underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}
          {heroPreviewUrl ? (
            <div>
              <p className="text-sm font-medium text-[var(--lf-ink)]">Hero preview</p>
              <div className="relative mt-2 h-52 w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <Image src={heroPreviewUrl} alt="Hero preview" fill unoptimized className="object-contain" />
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--lf-purple)] hover:underline"
                  onClick={downloadGeneratedHero}
                >
                  Download image
                </button>
              </div>
            </div>
          ) : null}
        </fieldset>

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
          <label
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]"
            htmlFor="ap-compare-at"
          >
            Compare-at price (₦, optional)
          </label>
          <input
            id="ap-compare-at"
            className={`${inputClass} mt-1.5`}
            inputMode="numeric"
            value={compareAtStr}
            onChange={(e) => setCompareAtStr(e.target.value)}
            placeholder="Leave blank unless this piece is on sale"
          />
          <p className="mt-1 text-xs text-[var(--lf-muted)]">
            When set, must be higher than the price above (shown as strikethrough “was” on the shop). Checkout still uses
            the current price.
          </p>
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

        <fieldset className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/40 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            Storefront product page (optional)
          </legend>
          <p className="text-xs leading-relaxed text-[var(--lf-muted)]">
            These fields match what shoppers see on the product page: gallery thumbnails, colour copy, accordions (Fitting,
            Fabric & care, Shipping), and the Craft & fabric panel. Leave blank to use site defaults.
          </p>

          <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--lf-ink)]">
            <input
              type="checkbox"
              className="mt-1 accent-[var(--lf-purple-deep)]"
              checked={galleryRestrictNoLookbook}
              onChange={(e) => setGalleryRestrictNoLookbook(e.target.checked)}
            />
            <span>
              <span className="font-medium">{"Gallery: only this dress's photos"}</span>
              <span className="mt-0.5 block text-xs font-normal text-[var(--lf-muted)]">
                When checked, the shop gallery uses the hero (and any extras below)—no generic lookbook filler. Uncheck to
                keep the old behaviour if you want extra thumbnails before you upload more angles.
              </span>
            </span>
          </label>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-gallery-files">
              Extra gallery images (optional, max 6)
            </label>
            <p className="mt-0.5 text-xs text-[var(--lf-muted)]">
              Additional angles or detail shots; each max 5 MB. Shown as thumbnails next to the hero on the PDP.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)]">
                <input
                  id="ap-gallery-files"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
                    const combined = [...galleryFiles, ...picked].slice(0, 6);
                    if (picked.length + galleryFiles.length > 6) {
                      setError("You can add at most 6 extra gallery images.");
                    } else {
                      setError(null);
                    }
                    setGalleryFiles(combined);
                    e.target.value = "";
                  }}
                />
                Choose files
              </label>
              {galleryFiles.length > 0 ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--lf-purple)] hover:underline"
                  onClick={() => setGalleryFiles([])}
                >
                  Clear gallery
                </button>
              ) : null}
            </div>
            {galleryFiles.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-xs text-[var(--lf-muted)]">
                {galleryFiles.map((f) => (
                  <li key={f.name + f.size}>{f.name}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-colour-notes">
              Colours / fabric availability (optional)
            </label>
            <p className="mt-0.5 text-xs text-[var(--lf-muted)]">Shown under the colour swatches on the PDP.</p>
            <textarea
              id="ap-colour-notes"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={colourAvailabilityNotes}
              onChange={(e) => setColourAvailabilityNotes(e.target.value)}
              placeholder="e.g. Wine, emerald, and navy silks available to order; swatches on WhatsApp."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-fitting">
              Fitting section (optional)
            </label>
            <textarea
              id="ap-fitting"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={fittingNotes}
              onChange={(e) => setFittingNotes(e.target.value)}
              placeholder="Overrides default “Fitting” accordion text when filled."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-fabric">
              Fabric & care section (optional)
            </label>
            <textarea
              id="ap-fabric"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={fabricCareNotes}
              onChange={(e) => setFabricCareNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-shipping">
              Shipping & returns section (optional)
            </label>
            <textarea
              id="ap-shipping"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={shippingNotes}
              onChange={(e) => setShippingNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-craft-body">
              Craft & fabric panel — main paragraph (optional)
            </label>
            <textarea
              id="ap-craft-body"
              className={`${inputClass} mt-1.5 min-h-[88px] resize-y`}
              value={craftFabricNotes}
              onChange={(e) => setCraftFabricNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-craft-labels">
              Craft & fabric — chip labels (optional)
            </label>
            <p className="mt-0.5 text-xs text-[var(--lf-muted)]">Comma or newline separated, up to 8 short phrases.</p>
            <textarea
              id="ap-craft-labels"
              className={`${inputClass} mt-1.5 min-h-[56px] resize-y`}
              value={craftFabricLabelsInput}
              onChange={(e) => setCraftFabricLabelsInput(e.target.value)}
              placeholder="Breathable layers, Lined bodice, …"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3 border border-zinc-100 bg-zinc-50/50 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            Advanced: original garment & new hero from photo (optional)
          </legend>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-source">
              Original garment photo (optional)
            </label>
            <p className="mt-0.5 text-xs text-[var(--lf-muted)]">On model, flat lay, or hanger — max 5 MB. Used as the truthful inventory reference.</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)]">
                <input
                  id="ap-source"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setSourceFile(f);
                    e.target.value = "";
                  }}
                />
                Choose file
              </label>
              {sourceFile ? <span className="text-sm text-[var(--lf-muted)]">{sourceFile.name}</span> : null}
              {sourceFile ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-[var(--lf-purple)] hover:underline"
                  onClick={() => {
                    setSourceFile(null);
                  }}
                >
                  Clear
                </button>
              ) : null}
            </div>
            {sourcePreviewUrl ? (
              <div className="relative mt-3 h-44 w-full max-w-xs overflow-hidden rounded-lg border border-zinc-200 bg-white">
                <Image src={sourcePreviewUrl} alt="Original preview" fill unoptimized className="object-contain" />
              </div>
            ) : null}
          </div>

          <div>
            <span className="block text-sm font-medium text-[var(--lf-ink)]">Mannequin context</span>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--lf-ink)]">
              {(
                [
                  ["unspecified", "Auto from photo"],
                  ["adult", "Adult mannequin"],
                  ["child", "Child mannequin"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="garment-audience"
                    className="accent-[var(--lf-purple-deep)]"
                    checked={garmentAudience === value}
                    onChange={() => setGarmentAudience(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-dress-category">
                Dress type
              </label>
              <select
                id="ap-dress-category"
                className={`${inputClass} mt-1.5`}
                value={dressCategory}
                onChange={(e) => {
                  setDressCategory(e.target.value as DressCategory);
                }}
              >
                {dressCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-mannequin-style">
                Mannequin type
              </label>
              <select
                id="ap-mannequin-style"
                className={`${inputClass} mt-1.5`}
                value={mannequinStyle}
                onChange={(e) => {
                  setMannequinStyle(e.target.value as MannequinStyle);
                }}
              >
                {mannequinStyleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-position-style">
                Positioning style
              </label>
              <select
                id="ap-position-style"
                className={`${inputClass} mt-1.5`}
                value={positionStyle}
                onChange={(e) => {
                  setPositionStyle(e.target.value as PositionStyle);
                }}
              >
                {positionStyleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--lf-muted)]">
                Keep this and mannequin type on auto to get a different pose and display form for each generation.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-background">
                Background
              </label>
              <select
                id="ap-background"
                className={`${inputClass} mt-1.5`}
                value={background}
                onChange={(e) => {
                  setBackground(e.target.value as StudioBackground);
                }}
              >
                {backgroundOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-lighting">
                Lighting
              </label>
              <select
                id="ap-lighting"
                className={`${inputClass} mt-1.5`}
                value={lighting}
                onChange={(e) => {
                  setLighting(e.target.value as StudioLighting);
                }}
              >
                {lightingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-camera-angle">
                Camera angle
              </label>
              <select
                id="ap-camera-angle"
                className={`${inputClass} mt-1.5`}
                value={cameraAngle}
                onChange={(e) => {
                  setCameraAngle(e.target.value as CameraAngle);
                }}
              >
                {cameraAngleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lf-ink)]" htmlFor="ap-hero-notes">
              Optional notes for Gemini
            </label>
            <textarea
              id="ap-hero-notes"
              className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
              value={heroNotes}
              onChange={(e) => setHeroNotes(e.target.value)}
              placeholder="e.g. preserve head-wrap; skirt is floor-length"
            />
          </div>

          <div>
            <button
              type="button"
              disabled={!canUseStorage || !sourceFile || geminiBusy}
              onClick={() => void generateCatalogHero()}
              className="rounded-full bg-[var(--lf-purple-deep)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)] disabled:opacity-50"
            >
              {geminiBusy ? "Generating…" : "Generate new hero from original photo (replaces current hero)"}
            </button>
            {!canUseStorage ? (
              <p className="mt-2 text-xs text-[var(--lf-muted)]">Sign in as an admin with Storage configured to run generation.</p>
            ) : null}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy || suggestBusy || !canPublish}
            className="rounded-full bg-[var(--lf-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple-deep)] disabled:opacity-50"
          >
            {busy ? "Publishing…" : suggestBusy ? "Waiting for AI draft…" : "Publish to catalogue"}
          </button>
        </div>
      </form>

      <AdminFormErrorBanner message={error} onDismiss={() => setError(null)} />
    </div>
  );
}

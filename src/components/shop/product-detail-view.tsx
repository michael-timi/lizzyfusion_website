"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { trackViewItem } from "@/lib/analytics-events";
import { addCartLine } from "@/lib/cart";
import type { CatalogProduct } from "@/lib/catalog";
import {
  getStyleVariantById,
  priceViewForSelection,
  productHasStyleVariants,
} from "@/lib/catalog-style-variants";
import { CatalogPriceStack } from "@/components/shop/catalog-price-stack";
import { productWhatsappEnquiryHref } from "@/lib/product-share";
import { formatNgn, site } from "@/lib/site";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { ProductShareButton } from "./product-share-button";
import { WishlistHeart } from "./wishlist-heart";
import { AdminEditProductLink } from "./admin-edit-product-link";

type Props = {
  product: CatalogProduct;
  gallery: string[];
  variantIdsByIndex?: string[][];
  related: CatalogProduct[];
};

const SWATCHES = ["#2d2d2d", "#8b7355", "#c4a574", "#f5f5f0"] as const;

const SWATCH_NAMES = ["Charcoal", "Warm brown", "Sand", "Ivory"] as const;

const SIZES = ["UK 8 / S", "UK 10 / M", "UK 12 / L", "UK 14 / XL", "Custom — note in chat"] as const;

const DEFAULT_FITTING_BODY = `${site.name} pieces are cut for modest ease through the bust, hip, and sleeve. Share your usual UK size and any length preferences in WhatsApp; bespoke adjustments are quoted separately.`;

const DEFAULT_FABRIC_BODY =
  "Fabrics vary by piece—cotton blends, crepe, and occasion-weight textiles are sourced in Lagos and Osogbo. Care labels ship with each order; when in doubt, dry clean for structured gowns and gentle cold wash for everyday cottons.";

const DEFAULT_SHIPPING_BODY = `Nationwide courier can be arranged after WhatsApp confirmation. Pickup in ${site.location.city} is available when your piece is ready. Return and alteration policies are agreed per order so fabric and labour stay fair for small studio production.`;

const DEFAULT_CRAFT_ASIDE =
  "Lizzy Fusion balances breathable layers with clean finishing—so you stay comfortable through long events without sacrificing polish. Ask on WhatsApp which textile is slated for your colourway.";

const DEFAULT_CRAFT_LABELS = ["Breathable layers", "Small-batch studio", "Osogbo finishing"] as const;

function AccordionRow({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[var(--lf-line)]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-[var(--lf-ink)] transition hover:text-[var(--lf-purple-deep)]"
        aria-expanded={open}
      >
        {title}
        <span className="text-lg font-light leading-none text-[var(--lf-muted)]">{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="pb-4 text-sm leading-relaxed text-[var(--lf-muted)]">{children}</div> : null}
    </div>
  );
}

export function ProductDetailView({ product, gallery, variantIdsByIndex = [], related }: Props) {
  const hasStyles = productHasStyleVariants(product);
  const initialVariantId = hasStyles ? (product.styleVariants?.[0]?.id ?? null) : null;
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialVariantId);
  const [selectedSwatch, setSelectedSwatch] = useState(0);
  const [size, setSize] = useState<string>(SIZES[1] ?? "");
  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({
    fitting: false,
    fabric: true,
    detail: false,
    shipping: true,
  });

  const mainSrc = gallery[activeIndex] ?? product.image;
  const priceView = priceViewForSelection(product, selectedVariantId);
  const selectedVariant = getStyleVariantById(product, selectedVariantId);
  const selectedStyleLabel = selectedVariant?.label;

  const activeStyleIds = variantIdsByIndex[activeIndex] ?? [];

  const lastViewedSlug = useRef<string | null>(null);
  useEffect(() => {
    if (lastViewedSlug.current === product.slug) return;
    lastViewedSlug.current = product.slug;
    void trackViewItem({
      item_id: product.slug,
      item_name: product.name,
      price: priceView.price,
      item_category: product.tag,
    });
  }, [product.slug, product.name, product.tag, priceView.price]);

  const selectGalleryIndex = (index: number) => {
    setActiveIndex(index);
    const ids = variantIdsByIndex[index] ?? [];
    if (ids.length === 1) setSelectedVariantId(ids[0]!);
    else if (ids.length > 1) {
      const cheapest = ids
        .map((id) => getStyleVariantById(product, id))
        .filter((v): v is NonNullable<typeof v> => Boolean(v))
        .sort((a, b) => a.price - b.price)[0];
      if (cheapest) setSelectedVariantId(cheapest.id);
    }
  };

  const selectStyleVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    const v = getStyleVariantById(product, variantId);
    if (v?.image) {
      const idx = gallery.indexOf(v.image);
      if (idx >= 0) setActiveIndex(idx);
      return;
    }
    const linkIdx = product.galleryStyleLinks?.find((l) => l.styleIds.includes(variantId))?.image;
    if (linkIdx) {
      const idx = gallery.indexOf(linkIdx);
      if (idx >= 0) setActiveIndex(idx);
    }
  };

  const waHref = useMemo(
    () =>
      productWhatsappEnquiryHref(product, {
        styleLabel: selectedStyleLabel,
        size,
        swatchIndex: selectedSwatch,
      }),
    [product, selectedStyleLabel, selectedSwatch, size],
  );

  const toggleAcc = (id: string) => {
    setAccOpen((s) => ({ ...s, [id]: !s[id] }));
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-10">
      <nav className="text-sm text-[var(--lf-muted)]" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-[var(--lf-ink)]">
          Home
        </Link>
        <span className="mx-2 text-zinc-300" aria-hidden>
          /
        </span>
        <Link href="/shop" className="transition hover:text-[var(--lf-ink)]">
          Shop
        </Link>
        <span className="mx-2 text-zinc-300" aria-hidden>
          /
        </span>
        <span className="font-medium text-[var(--lf-ink)]">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:gap-12 xl:grid-cols-[5rem_minmax(0,1fr)_minmax(280px,380px)]">
        {/* Thumbnails — wide screens */}
        <div className="hidden flex-col gap-2 xl:flex">
          {gallery.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              onClick={() => selectGalleryIndex(i)}
              className={`relative aspect-[3/4] w-full overflow-hidden border bg-zinc-100 transition ${
                activeIndex === i ? "border-[var(--lf-ink)] ring-1 ring-[var(--lf-ink)]" : "border-[var(--lf-line)] hover:border-zinc-400"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <LfRemoteImage src={url} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>

        {/* Gallery + main */}
        <div className="min-w-0 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 xl:hidden">
            {gallery.map((url, i) => (
              <button
                key={`m-${url}-${i}`}
                type="button"
                onClick={() => selectGalleryIndex(i)}
                className={`relative h-28 w-20 shrink-0 overflow-hidden border bg-zinc-100 ${
                  activeIndex === i ? "border-[var(--lf-ink)]" : "border-[var(--lf-line)]"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                <LfRemoteImage src={url} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-lg overflow-hidden bg-zinc-100 lg:max-w-none">
            <LfRemoteImage
              key={mainSrc}
              src={mainSrc}
              alt={product.name}
              fill
              priority
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 55vw"
            />
            <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
              <WishlistHeart slug={product.slug} />
              <ProductShareButton
                product={product}
                styleLabel={selectedStyleLabel}
              />
            </div>
          </div>
          {hasStyles && activeStyleIds.length > 0 ? (
            <p className="text-center text-xs leading-relaxed text-[var(--lf-muted)]">
              This photo shows:{" "}
              {activeStyleIds
                .map((id) => {
                  const v = getStyleVariantById(product, id);
                  return v ? `${v.label} (${formatNgn(v.price)})` : null;
                })
                .filter(Boolean)
                .join(" · ")}
              {activeStyleIds.length > 1 ? " — choose your style below to update the price." : ""}
            </p>
          ) : null}
        </div>

        {/* Product panel */}
        <div className="min-w-0">
          <AdminEditProductLink slug={product.slug} />
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-wider text-[var(--lf-muted)]">{product.tag}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--lf-muted)]">{product.description}</p>
          <p className="mt-2 text-xs text-[var(--lf-muted)]">{product.lead}</p>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-ink)]">Price</p>
            <div className="mt-1.5">
              <CatalogPriceStack product={{ ...product, ...priceView }} align="start" />
            </div>
          </div>

          {hasStyles && product.styleVariants ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-ink)]">Style</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.styleVariants.map((v) => {
                  const inActivePhoto = activeStyleIds.includes(v.id);
                  const selected = selectedVariantId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectStyleVariant(v.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selected
                          ? "border-[var(--lf-ink)] bg-[var(--lf-ink)] text-white"
                          : inActivePhoto
                            ? "border-violet-400 bg-violet-50 text-[var(--lf-ink)]"
                            : "border-[var(--lf-line)] bg-white text-[var(--lf-ink)] hover:border-[var(--lf-purple)]"
                      }`}
                    >
                      {v.label} · {formatNgn(v.price)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[var(--lf-muted)]">
                Combo photos can show several styles at once — pick the style you want; the price updates to match.
              </p>
            </div>
          ) : null}

          {"sourceImage" in product && typeof product.sourceImage === "string" && product.sourceImage.startsWith("https://") ? (
            <div className="mt-8 border-t border-[var(--lf-line)] pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-ink)]">Original listing photo</p>
              <p className="mt-1 text-xs text-[var(--lf-muted)]">
                Unedited reference of the garment (studio record). The main gallery above shows the catalogue hero.
              </p>
              <div className="relative mx-auto mt-3 aspect-[3/4] w-full max-w-[14rem] overflow-hidden bg-zinc-100">
                <LfRemoteImage
                  src={product.sourceImage}
                  alt={`${product.name} — original listing`}
                  fill
                  className="object-cover object-top"
                  sizes="224px"
                />
              </div>
            </div>
          ) : null}

          <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-[var(--lf-ink)]">Colours</p>
          <div className="mt-2 flex gap-2">
            {SWATCHES.map((hex, i) => (
              <button
                key={hex}
                type="button"
                onClick={() => setSelectedSwatch(i)}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  selectedSwatch === i ? "border-[var(--lf-ink)] ring-2 ring-[var(--lf-purple)]/30" : "border-zinc-200"
                }`}
                style={{ backgroundColor: hex }}
                aria-label={`Colour option ${i + 1}`}
              />
            ))}
          </div>
          {product.colourAvailabilityNotes?.trim() ? (
            <p className="mt-3 text-sm leading-relaxed text-[var(--lf-muted)]">{product.colourAvailabilityNotes.trim()}</p>
          ) : null}

          <div className="mt-8 flex items-baseline justify-between gap-4">
            <label htmlFor="pdp-size" className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-ink)]">
              Size
            </label>
            <Link href="/contact" className="text-xs font-medium text-[var(--lf-muted)] underline-offset-2 hover:text-[var(--lf-purple-deep)] hover:underline">
              Size guide
            </Link>
          </div>
          <select
            id="pdp-size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="mt-2 w-full border border-[var(--lf-line)] bg-white px-3 py-2.5 text-sm text-[var(--lf-ink)] outline-none transition focus:border-[var(--lf-purple)]"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center bg-[var(--lf-purple-deep)] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
            >
              Enquire on WhatsApp — {formatNgn(priceView.price)}
            </a>
            <ProductShareButton
              product={product}
              styleLabel={selectedStyleLabel}
              variant="button"
              className="flex-1"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              addCartLine({
                slug: product.slug,
                size,
                color: selectedStyleLabel
                  ? `${selectedStyleLabel} · ${SWATCH_NAMES[selectedSwatch] ?? `Swatch ${selectedSwatch + 1}`}`
                  : SWATCH_NAMES[selectedSwatch] ?? `Option ${selectedSwatch + 1}`,
                unitPrice: priceView.price,
                productName: product.name,
                productImage: mainSrc,
              })
            }
            className="mt-3 w-full border border-[var(--lf-ink)] bg-white px-6 py-3 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple-deep)] hover:bg-zinc-50"
          >
            Add to bag
          </button>

          <p className="mt-6 text-xs text-[var(--lf-muted)]">
            <span aria-hidden>↩</span> Returns and alterations are agreed on WhatsApp before dispatch. Tap the heart on
            the photo to save this piece to your wish list.
          </p>
        </div>
      </div>

      {/* Accordions + material */}
      <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-12">
        <div>
          <AccordionRow id="fitting" title="Fitting" open={accOpen.fitting ?? false} onToggle={toggleAcc}>
            {product.fittingNotes?.trim() ?? DEFAULT_FITTING_BODY}
          </AccordionRow>
          <AccordionRow id="fabric" title="Fabric & care" open={accOpen.fabric ?? false} onToggle={toggleAcc}>
            {product.fabricCareNotes?.trim() ?? DEFAULT_FABRIC_BODY}
          </AccordionRow>
          <AccordionRow id="detail" title="Product detail" open={accOpen.detail ?? false} onToggle={toggleAcc}>
            {product.name} — {product.tag}. {product.description} Lead time: {product.lead}
          </AccordionRow>
          <AccordionRow id="shipping" title="Shipping & returns" open={accOpen.shipping ?? false} onToggle={toggleAcc}>
            {product.shippingNotes?.trim() ?? DEFAULT_SHIPPING_BODY}
          </AccordionRow>
        </div>

        <aside className="border border-[var(--lf-line)] bg-zinc-50 p-6 sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-[var(--lf-ink)]">Craft & fabric</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--lf-muted)]">
            {product.craftFabricNotes?.trim() ?? DEFAULT_CRAFT_ASIDE}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {(product.craftFabricLabels && product.craftFabricLabels.length > 0
              ? product.craftFabricLabels
              : [...DEFAULT_CRAFT_LABELS]
            ).map((label) => (
              <span
                key={label}
                className="rounded-full border border-[var(--lf-line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--lf-ink)]"
              >
                {label}
              </span>
            ))}
          </div>
        </aside>
      </div>

      {/* You may also like */}
      {related.length > 0 ? (
        <section className="mt-20 border-t border-[var(--lf-line)] pt-16">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-3xl">You may also like</h2>
          <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.slug} className="group/card border border-[var(--lf-line)] bg-white shadow-sm">
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
                  <Link href={`/shop/${p.slug}`} className="absolute inset-0 z-0 block">
                    <LfRemoteImage
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition duration-500 group-hover/card:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </Link>
                  <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                    <WishlistHeart slug={p.slug} />
                    <ProductShareButton product={p} />
                  </div>
                </div>
                <div className="p-4 sm:p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--lf-muted)]">{p.tag}</p>
                  <Link href={`/shop/${p.slug}`} className="mt-1 block font-semibold text-[var(--lf-ink)] hover:text-[var(--lf-purple-deep)]">
                    {p.name}
                  </Link>
                  <CatalogPriceStack product={p} align="start" />
                  <div className="mt-3 flex gap-1.5">
                    {SWATCHES.slice(0, 3).map((hex) => (
                      <span
                        key={hex}
                        className="h-4 w-4 rounded-full border border-zinc-200"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

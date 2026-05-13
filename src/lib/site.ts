/** Lizzy Fusion — single source for contact, brand copy, and business rules. */

import type { CartLine } from "@/lib/cart";

export const site = {
  name: "Lizzy Fusion",
  slogan: "Modesty Redefined, Style Redesigned",
  location: {
    city: "Osogbo",
    state: "Osun State",
    country: "Nigeria",
    line: "Osogbo, Osun State, Nigeria",
  },
  contact: {
    phoneDisplay: "+234 (0) 906 780 3879",
    /** E.164 without + for wa.me */
    phoneWa: "2349067803879",
    email: "lizzyfusioninbox@gmail.com",
  },
  vision:
    "To embrace a harmonious blend of modesty, innovation and the synergy of classic styles, where each design narrates a story of timeless grace infused with contemporary flair. Redefine your style with Lizzy Fusion, where modesty meets the cutting edge of fashion.",
  mission: [
    "At Lizzy Fusion, our mission is to empower women and children with a unique fusion of modesty and style, crafting fashion that transcends boundaries and celebrates diverse expressions of elegance.",
    "We strive to redefine the fashion landscape by seamlessly blending traditional modesty with avant-garde design, fostering confidence and self-expression. Committed to sustainability and ethical practices, we aim to leave a positive impact on both the fashion industry and the world, inspiring a new era of conscious and captivating style.",
  ],
  specialties: [
    "Wedding dress",
    "Ready-to-wear",
    "Children’s wear",
    "Reception dress",
    "Aso-ebi",
    "Dinner gowns",
    "Casual wear",
    "Civil dress",
    "Church wear",
    "Office wear",
    "Ball gowns",
  ],
  offerings: [
    {
      title: "Bespoke",
      description:
        "Made-to-measure pieces built around your measurements, occasion, and fabric choices—with fittings guided in studio or by appointment.",
    },
    {
      title: "Ready-to-wear",
      description:
        "Curated pieces you can order in available sizes. Stock and lead times are confirmed on WhatsApp after you enquire from the site.",
    },
    {
      title: "Custom design",
      description:
        "When you love our aesthetic but want something unique—share references, mood, and timeline; we co-design with you.",
    },
  ],
  training: {
    mode: "In-person training at our Osogbo studio.",
    onlineNote:
      "Online programmes will be announced here and on our channels when they are ready.",
  },
  /** Web-ready logo (header, hero, OG). */
  logo: "/brand/lizzy-fusion-logo.png",
  /** Full brand overview sheet (vision, mission, palette). */
  brandAsset: "/brand/lizzy-fusion-brand-overview.png",
  /** Top bar — shipping / studio message (Modimal-style strip). */
  announcement:
    "Nationwide delivery arranged on request · Complimentary fitting notes for bespoke in Osogbo",
} as const;

/**
 * Canonical origin for Open Graph, sitemap, and robots.
 * Set `NEXT_PUBLIC_SITE_URL` in production (HTTPS, no trailing slash), e.g. `https://www.yourdomain.com`.
 */
export function publicSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** Replace with real pieces and photography when available. */
export const sampleProducts = [
  {
    slug: "signature-abaya-rtw",
    name: "Signature layered abaya",
    tag: "Ready-to-wear",
    price: 85000,
    lead: "Ships / pickup in Osogbo after size confirmation.",
    description:
      "Layered modest silhouette with a soft drape—ideal for receptions and elevated everyday. Pair with heels or flats; length and lining tweaks are guided in studio.",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80&auto=format&fit=crop",
  },
  {
    slug: "aso-ebi-set",
    name: "Aso-ebi set (blouse & wrapper)",
    tag: "Made-to-order",
    price: 125000,
    lead: "Fabric discussion on WhatsApp; group orders welcome.",
    description:
      "Coordinated blouse and wrapper tailored for aso-ebi groups. Embellishment and fabric are finalised on WhatsApp before cutting so every piece matches your palette.",
    image:
      "https://images.unsplash.com/photo-1556821840-30a7b40c77e9?w=800&q=80&auto=format&fit=crop",
  },
  {
    slug: "office-modest-set",
    name: "Office modest co-ord",
    tag: "Ready-to-wear",
    price: 62000,
    lead: "Limited sizes — ask for availability.",
    description:
      "Clean co-ord set for boardroom-to-brunch days. Breathable layers keep you comfortable through long hours; confirm available sizes on WhatsApp before pickup.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop",
  },
  {
    slug: "reception-full-length",
    name: "Reception full-length gown",
    tag: "Made-to-order",
    price: 185000,
    lead: "Fittings in Osogbo; fabric sourced with you.",
    description:
      "Floor-length reception drama with structure through the bodice and ease through the skirt. Fittings happen in Osogbo with fabric sourcing guided by the studio.",
    image:
      "https://images.unsplash.com/photo-1566174053879-435285fbf655?w=800&q=80&auto=format&fit=crop",
  },
  {
    slug: "everyday-wrap-dress",
    name: "Everyday wrap dress",
    tag: "Ready-to-wear",
    price: 48000,
    lead: "Light layering; check sizes on WhatsApp.",
    description:
      "Easy wrap dress for errands, visits, and low-key events. Light layering works year-round—ask for current colourways and sizes on WhatsApp.",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80&auto=format&fit=crop",
  },
  {
    slug: "church-shift-dress",
    name: "Church shift dress",
    tag: "Ready-to-wear",
    price: 55000,
    lead: "Classic length; limited restock.",
    description:
      "Classic shift length with modest coverage for Sunday and weekday services. Limited restock cycles—message the studio to hold your size.",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80&auto=format&fit=crop",
  },
] as const;

export type SampleProduct = (typeof sampleProducts)[number];

export function getSampleProductBySlug(slug: string): SampleProduct | undefined {
  return sampleProducts.find((p) => p.slug === slug);
}

/** Resolve name, price, and image for a cart line (code catalogue + optional snapshots from add-to-bag). */
export function resolveCartLineDisplay(line: CartLine): {
  slug: string;
  name: string;
  price: number;
  image: string;
} | null {
  const sample = getSampleProductBySlug(line.slug);
  const price = line.unitPrice ?? sample?.price;
  const name = line.productName ?? sample?.name;
  const image = line.productImage ?? sample?.image;
  if (price === undefined || typeof name !== "string" || !name || typeof image !== "string" || !image) return null;
  return { slug: line.slug, name, price, image };
}

/** Map nav mega “specialty” labels to a representative catalogue PDP (or `/shop` when none fits). */
export function shopHrefForSpecialty(label: string): string {
  const table: Record<string, SampleProduct["slug"]> = {
    "Wedding dress": "reception-full-length",
    "Ready-to-wear": "signature-abaya-rtw",
    "Reception dress": "reception-full-length",
    "Aso-ebi": "aso-ebi-set",
    "Dinner gowns": "reception-full-length",
    "Casual wear": "everyday-wrap-dress",
    "Civil dress": "everyday-wrap-dress",
    "Church wear": "church-shift-dress",
    "Office wear": "office-modest-set",
    "Ball gowns": "reception-full-length",
  };
  const slug = table[label];
  return slug ? `/shop/${slug}` : "/shop";
}

/** Primary storefront nav (Modimal-style). Other routes stay in footer / mobile sheet. */
export const navStorefront = [
  { id: "collection", label: "Collection", href: "/shop" },
  { id: "new-in", label: "New In", href: "/shop#best-sellers" },
  { id: "lookbook", label: "Lookbook", href: "/lookbook" },
  { id: "occasions", label: "Occasions", href: "/custom" },
  { id: "sustainability", label: "Craft & care", href: "/craft-care" },
] as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/blog", label: "Journal" },
  { href: "/custom", label: "Custom / Bespoke" },
  { href: "/training", label: "Training" },
  { href: "/apprentice", label: "Apprentices" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/register", label: "Create account" },
] as const;

/** Hero + collection tiles — placeholder photography until studio shots exist. */
export const landingMedia = {
  hero: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=2400&q=85&auto=format&fit=crop",
  sustainability:
    "https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=2000&q=80&auto=format&fit=crop",
  collectionTiles: [
    {
      label: "Wedding & reception",
      href: "/shop/reception-full-length",
      image:
        "https://images.unsplash.com/photo-1566174053879-435285fbf655?w=900&q=80&auto=format&fit=crop",
      span: "large" as const,
    },
    {
      label: "Dresses & gowns",
      href: "/shop/everyday-wrap-dress",
      image:
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=80&auto=format&fit=crop",
      span: "tall" as const,
    },
    {
      label: "Ready-to-wear",
      href: "/shop/signature-abaya-rtw",
      image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80&auto=format&fit=crop",
      span: "wide" as const,
    },
    {
      label: "Church & office",
      href: "/shop/office-modest-set",
      image:
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900&q=80&auto=format&fit=crop",
      span: "small" as const,
    },
  ],
  lookbook: [
    {
      label: "Sunday",
      caption: "Quiet polish",
      href: "/lookbook?day=Sunday",
      image:
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80&auto=format&fit=crop",
      heroImage:
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=1400&q=85&auto=format&fit=crop",
      shopSlugs: ["church-shift-dress", "signature-abaya-rtw"] as const,
      badgeNewOnIndex: 0,
    },
    {
      label: "Monday",
      caption: "Aso-ebi mood",
      href: "/lookbook?day=Monday",
      image:
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80&auto=format&fit=crop",
      heroImage:
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1400&q=85&auto=format&fit=crop",
      shopSlugs: ["aso-ebi-set", "reception-full-length"] as const,
      badgeNewOnIndex: 0,
    },
    {
      label: "Tuesday",
      caption: "Office modest",
      href: "/lookbook?day=Tuesday",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80&auto=format&fit=crop",
      heroImage:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1400&q=85&auto=format&fit=crop",
      shopSlugs: ["office-modest-set", "church-shift-dress"] as const,
    },
    {
      label: "Wednesday",
      caption: "Reception glam",
      href: "/lookbook?day=Wednesday",
      image:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80&auto=format&fit=crop",
      heroImage:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1400&q=85&auto=format&fit=crop",
      shopSlugs: ["reception-full-length", "everyday-wrap-dress"] as const,
      badgeNewOnIndex: 1,
    },
    {
      label: "Thursday",
      caption: "Casual fusion",
      href: "/lookbook?day=Thursday",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80&auto=format&fit=crop",
      heroImage:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=85&auto=format&fit=crop",
      shopSlugs: ["everyday-wrap-dress", "signature-abaya-rtw"] as const,
    },
    {
      label: "Friday",
      caption: "Golden hour",
      href: "/lookbook?day=Friday",
      image:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80&auto=format&fit=crop",
      heroImage:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1400&q=85&auto=format&fit=crop",
      shopSlugs: ["signature-abaya-rtw", "office-modest-set"] as const,
      badgeNewOnIndex: 0,
    },
    {
      label: "Saturday",
      caption: "Weekend statement",
      href: "/lookbook?day=Saturday",
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80&auto=format&fit=crop",
      heroImage:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1400&q=85&auto=format&fit=crop",
      shopSlugs: ["office-modest-set", "reception-full-length"] as const,
      badgeNewOnIndex: 0,
    },
  ],
  /** Split-panel register / login (lifestyle). */
  authPanel:
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1400&q=80&auto=format&fit=crop",
  /** Women’s & children’s wear, fabrics — no accessories or menswear placeholders. */
  social: [
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80&auto=format&fit=crop",
  ],
} as const;

export type LookbookLook = (typeof landingMedia.lookbook)[number];

/** Resolve the two catalogue pieces that make up a lookbook “shop the look” row. */
export function lookbookShopProducts(look: LookbookLook): [SampleProduct, SampleProduct] | null {
  const a = getSampleProductBySlug(look.shopSlugs[0]);
  const b = getSampleProductBySlug(look.shopSlugs[1]);
  if (!a || !b) return null;
  return [a, b];
}

/** PDP gallery: primary image plus lookbook alternates (up to 4). */
export function galleryUrlsForProduct(product: { slug: string; image: string }): readonly string[] {
  const urls: string[] = [product.image];
  for (const row of landingMedia.lookbook) {
    if (urls.length >= 4) break;
    if (!urls.includes(row.image)) urls.push(row.image);
  }
  while (urls.length < 4) urls.push(product.image);
  return urls;
}

export function formatNgn(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function whatsappHref(text: string) {
  const encoded = encodeURIComponent(text.trim());
  return `https://wa.me/${site.contact.phoneWa}?text=${encoded}`;
}

export function mailtoHref(subject: string, body: string) {
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${site.contact.email}?${params.toString()}`;
}

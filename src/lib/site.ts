/** Lizzy Fusion — single source for contact, brand copy, and business rules. */

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
    "At Lizzy Fusion, our mission is to empower individuals with a unique fusion of modesty and style, crafting fashion that transcends boundaries and celebrates diverse expressions of elegance.",
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

/** Replace with real pieces and photography when available. */
export const sampleProducts = [
  {
    slug: "signature-abaya-rtw",
    name: "Signature layered abaya",
    tag: "Ready-to-wear",
    price: 85000,
    lead: "Ships / pickup in Osogbo after size confirmation.",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80&auto=format&fit=crop",
  },
  {
    slug: "aso-ebi-set",
    name: "Aso-ebi set (blouse & wrapper)",
    tag: "Made-to-order",
    price: 125000,
    lead: "Fabric discussion on WhatsApp; group orders welcome.",
    image:
      "https://images.unsplash.com/photo-1556821840-30a7b40c77e9?w=800&q=80&auto=format&fit=crop",
  },
  {
    slug: "office-modest-set",
    name: "Office modest co-ord",
    tag: "Ready-to-wear",
    price: 62000,
    lead: "Limited sizes — ask for availability.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop",
  },
] as const;

/** Primary storefront nav (Modimal-style). Other routes stay in footer / mobile sheet. */
export const navStorefront = [
  { id: "collection", label: "Collection", href: "/shop" },
  { id: "new-in", label: "New In", href: "/shop#best-sellers" },
  { id: "lookbook", label: "Lookbook", href: "/shop#lookbook" },
  { id: "occasions", label: "Occasions", href: "/custom" },
  { id: "sustainability", label: "Craft & care", href: "/about" },
] as const;

export const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/custom", label: "Custom / Bespoke" },
  { href: "/training", label: "Training" },
  { href: "/apprentice", label: "Apprentices" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/** Hero + collection tiles — placeholder photography until studio shots exist. */
export const landingMedia = {
  hero: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=2400&q=85&auto=format&fit=crop",
  sustainability:
    "https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=2000&q=80&auto=format&fit=crop",
  collectionTiles: [
    {
      label: "Wedding & reception",
      href: "/shop",
      image:
        "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80&auto=format&fit=crop",
      span: "large" as const,
    },
    {
      label: "Dresses & gowns",
      href: "/shop",
      image:
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=900&q=80&auto=format&fit=crop",
      span: "tall" as const,
    },
    {
      label: "Ready-to-wear",
      href: "/shop",
      image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80&auto=format&fit=crop",
      span: "wide" as const,
    },
    {
      label: "Church & office",
      href: "/shop",
      image:
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900&q=80&auto=format&fit=crop",
      span: "small" as const,
    },
  ],
  lookbook: [
    {
      label: "Monday",
      caption: "Aso-ebi mood",
      image:
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80&auto=format&fit=crop",
    },
    {
      label: "Tuesday",
      caption: "Office modest",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80&auto=format&fit=crop",
    },
    {
      label: "Wednesday",
      caption: "Reception glam",
      image:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80&auto=format&fit=crop",
    },
    {
      label: "Thursday",
      caption: "Casual fusion",
      image:
        "https://images.unsplash.com/photo-1469334031218-e382a71b764b?w=600&q=80&auto=format&fit=crop",
    },
  ],
  social: [
    "https://images.unsplash.com/photo-1525507119028-ed4c629a60a6?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1469334031218-e382a71b764b?w=600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80&auto=format&fit=crop",
  ],
} as const;

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

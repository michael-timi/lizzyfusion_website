import { site } from "@/lib/site";

export type FaqItem = {
  id: string;
  question: string;
  /** Paragraphs separated by double newlines. */
  answer: string;
};

export const faqItems: FaqItem[] = [
  {
    id: "contact",
    question: "How do I contact your customer service?",
    answer: `The fastest channel is WhatsApp on ${site.contact.phoneDisplay}—tap from any product page or the Contact form. You can also email ${site.contact.email} or call the same number during studio hours (we reply within one to two business days when volume is high).\n\nFor bespoke and aso-ebi groups, mention your event date in the first message so we can prioritise.`,
  },
  {
    id: "ship",
    question: "When will my order ship?",
    answer: `Ready-to-wear ships or is ready for Osogbo pickup after size confirmation on WhatsApp—usually within the lead time shown on the product. Made-to-order and reception gowns follow a cutting calendar we share when you pay your deposit.\n\nNationwide courier is arranged on request; you will get a photo or tracking note when your parcel leaves the studio.`,
  },
  {
    id: "cancel",
    question: "Can I cancel or modify my order?",
    answer: `If cutting has not started, we can usually change fabric, colour, or size. Once work has begun, changes may incur a remake fee. Cancellations before fabric is cut are refunded per the agreement we send on WhatsApp; after cutting, deposits cover labour and materials already used.\n\nMessage the studio as soon as something changes—same-day replies are not guaranteed but we read every thread in order.`,
  },
  {
    id: "shipping-options",
    question: "What are my shipping options?",
    answer: `Osogbo clients can collect in studio or use a rider we trust. Elsewhere in Nigeria we work with couriers you approve or recommend; international shipping is quoted case by case when we offer it.\n\nFragile embellishments are wrapped with extra padding; you will see packaging notes on the Craft & care page.`,
  },
  {
    id: "payment",
    question: "What type of payment methods do you offer?",
    answer: `Most clients pay via bank transfer or POS in studio; we confirm account details only on WhatsApp or in person—never through random DMs. Card links may be offered for specific campaigns; we do not store card numbers on this website.\n\nDeposits for bespoke are typically staged (deposit + balance before finishing).`,
  },
  {
    id: "size",
    question: "Which size will fit me best?",
    answer: `Each ready-to-wear listing notes the block we cut to; send your bust, waist, hip, and height on WhatsApp and we will map you to a size or suggest bespoke if you sit between sizes.\n\nFor full-length gowns we book a fitting in Osogbo when possible, or work from measurements and reference photos you provide remotely.`,
  },
  {
    id: "care",
    question: "How do I take care of my pieces?",
    answer: `Care cards ship with orders: structured gowns are often dry-clean only; cotton and jersey blends may be cold gentle wash and air dry. Packaging and storage tips live on the Craft & care hub under Product care.\n\nWhen in doubt, send a photo of the care label before washing.`,
  },
  {
    id: "manufacture",
    question: "Where and how do you manufacture your products?",
    answer: `${site.name} is cut and sewn primarily in our Osogbo studio and vetted partner workshops in Nigeria. Bespoke and aso-ebi are tracked from first sketch through finishing QC before you collect or we ship.\n\nWe do not mass-produce anonymous batches—batch sizes stay small so quality stays visible.`,
  },
  {
    id: "suppliers",
    question: "How do you find and evaluate your suppliers?",
    answer: `We buy fabrics and trims from mills and markets we have visited or vetted through long-standing relationships—swatch tests, shrinkage checks, and colour fastness matter before we offer a cloth to clients.\n\nWhen a fibre claim matters to you (organic cotton, mulesing-free wool, etc.), ask on WhatsApp and we will share what we know for that roll.`,
  },
  {
    id: "workers",
    question: "How do your suppliers and partners support their workers?",
    answer: `We favour suppliers who pay predictable wages and keep reasonable hours; for partner workshops we visit periodically and align on timelines that do not rely on unpaid overtime.\n\nOur apprenticeships and training blocks are part of the same picture—growing skills locally rather than racing to the cheapest anonymous labour.`,
  },
];

import type { Metadata } from "next";
import { FaqsView } from "@/components/faqs/faqs-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQs",
  description: `Orders, shipping, sizing, and studio policies · ${site.name}`,
};

export default function FaqsPage() {
  return <FaqsView />;
}

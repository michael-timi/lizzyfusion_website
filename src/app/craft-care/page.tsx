import type { Metadata } from "next";
import { CraftCareOverview } from "@/components/craft-care/craft-care-overview";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Craft & care",
  description: `Sustainability, materials, and how ${site.name} works in Osogbo.`,
};

export default function CraftCarePage() {
  return <CraftCareOverview />;
}

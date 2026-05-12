import type { Metadata } from "next";
import { CraftCareMaterials } from "@/components/craft-care/craft-care-materials";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Materials",
  description: `Sustainably sourced fibres and how we use them · ${site.name}`,
};

export default function CraftCareMaterialsPage() {
  return <CraftCareMaterials />;
}

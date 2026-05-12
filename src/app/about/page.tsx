import type { Metadata } from "next";
import { AboutPageView } from "@/components/about/about-page-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Vision, mission, and brand story for ${site.name} in ${site.location.line}.`,
};

export default function AboutPage() {
  return <AboutPageView />;
}

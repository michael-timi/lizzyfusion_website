import type { Metadata } from "next";
import { BlogIndexView } from "@/components/blog/blog-index-view";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Journal",
  description: `Stories and notes from ${site.name} — modest fashion in ${site.location.line}.`,
};

export default function BlogPage() {
  return <BlogIndexView />;
}

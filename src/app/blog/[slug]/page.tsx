import type { Metadata } from "next";
import { BlogPostView } from "@/components/blog/blog-post-view";
import { site } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Article",
    description: `Read this journal entry on ${site.name}.`,
    openGraph: { title: `Journal — ${site.name}` },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  return <BlogPostView slug={decodeURIComponent(slug)} />;
}

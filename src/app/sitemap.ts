import type { MetadataRoute } from "next";
import { getMergedCatalog } from "@/lib/catalog";
import { publicSiteUrl } from "@/lib/site";

const staticPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] =
  [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/shop", changeFrequency: "weekly", priority: 0.95 },
    { path: "/lookbook", changeFrequency: "weekly", priority: 0.85 },
    { path: "/craft-care", changeFrequency: "monthly", priority: 0.85 },
    { path: "/craft-care/materials", changeFrequency: "monthly", priority: 0.8 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.85 },
    { path: "/faqs", changeFrequency: "monthly", priority: 0.8 },
    { path: "/policies", changeFrequency: "yearly", priority: 0.5 },
    { path: "/about", changeFrequency: "monthly", priority: 0.75 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.72 },
    { path: "/custom", changeFrequency: "monthly", priority: 0.8 },
    { path: "/cart", changeFrequency: "monthly", priority: 0.6 },
    { path: "/wishlist", changeFrequency: "monthly", priority: 0.6 },
    { path: "/checkout", changeFrequency: "monthly", priority: 0.4 },
    { path: "/checkout/info", changeFrequency: "monthly", priority: 0.4 },
    { path: "/checkout/shipping", changeFrequency: "monthly", priority: 0.4 },
    { path: "/checkout/payment", changeFrequency: "monthly", priority: 0.4 },
    { path: "/checkout/success", changeFrequency: "yearly", priority: 0.2 },
    { path: "/checkout/failure", changeFrequency: "yearly", priority: 0.2 },
    { path: "/training", changeFrequency: "monthly", priority: 0.65 },
    { path: "/apprentice", changeFrequency: "monthly", priority: 0.65 },
    { path: "/login", changeFrequency: "yearly", priority: 0.35 },
    { path: "/register", changeFrequency: "yearly", priority: 0.35 },
  ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicSiteUrl();
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = staticPaths.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path || "/"}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  const merged = await getMergedCatalog();
  for (const p of merged) {
    entries.push({
      url: `${base}/shop/${p.slug}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  return entries;
}

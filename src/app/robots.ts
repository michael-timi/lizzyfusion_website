import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = publicSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

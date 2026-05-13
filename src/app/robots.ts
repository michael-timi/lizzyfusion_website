import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = publicSiteUrl();
  try {
    const host = new URL(base).host;
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin"],
      },
      sitemap: `${base}/sitemap.xml`,
      host,
    };
  } catch {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin"],
      },
      sitemap: `${base}/sitemap.xml`,
    };
  }
}

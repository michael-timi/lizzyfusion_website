import type { Metadata } from "next";
import type { CatalogProduct } from "@/lib/catalog";
import { productOgImageUrl, productShareUrl } from "@/lib/product-share";
import { site } from "@/lib/site";

export function buildProductPageMetadata(product: CatalogProduct, slug: string): Metadata {
  const desc =
    product.description.length > 155 ? `${product.description.slice(0, 155)}…` : product.description;
  const url = productShareUrl(slug);
  const image = productOgImageUrl(product.image);
  const title = `${product.name} · ${site.name}`;

  return {
    title: `${product.name} · Shop`,
    description: `${desc} Prices in Naira · ${site.name}.`,
    alternates: { canonical: `/shop/${slug}` },
    robots: { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description: desc,
      url,
      locale: "en_NG",
      images: [
        {
          url: image,
          alt: product.name,
          width: 1200,
          height: 1200,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [image],
    },
  };
}

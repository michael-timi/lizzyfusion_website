import type { CatalogProduct } from "@/lib/catalog";
import { publicSiteUrl, site } from "@/lib/site";

/** schema.org `Product` + `Offer` for PDP rich results (prices in NGN). */
export function catalogProductJsonLd(product: CatalogProduct, slug: string): Record<string, unknown> {
  const base = publicSiteUrl();
  const url = `${base}/shop/${encodeURIComponent(slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image],
    sku: slug,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: String(product.price),
      availability: "https://schema.org/PreOrder",
      url,
      seller: { "@type": "Organization", name: site.name },
    },
  };
}

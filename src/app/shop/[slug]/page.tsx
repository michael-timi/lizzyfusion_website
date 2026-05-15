import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/shop/product-detail-view";
import { getCatalogProductBySlug, getMergedCatalog } from "@/lib/catalog";
import { catalogProductJsonLd } from "@/lib/product-json-ld";
import { buildPdpGallery } from "@/lib/catalog-style-variants";
import { galleryUrlsForProduct, site } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const products = await getMergedCatalog();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) {
    return { title: "Product", robots: { index: false, follow: true } };
  }
  const desc =
    product.description.length > 155 ? `${product.description.slice(0, 155)}…` : product.description;
  const canonical = `/shop/${slug}`;
  return {
    title: `${product.name} · Shop`,
    description: `${desc} Prices in Naira · ${site.name}.`,
    alternates: { canonical },
    robots: { index: true, follow: true, "max-image-preview": "large" },
    openGraph: {
      title: `${product.name} · ${site.name}`,
      description: desc,
      type: "website",
      url: canonical,
      locale: "en_NG",
      images: [{ url: product.image, alt: product.name, width: 1200, height: 1200 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${site.name}`,
      description: desc,
      images: [product.image],
    },
  };
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) notFound();

  const built = buildPdpGallery(product);
  const gallery =
    built.urls.length > 0 ? [...built.urls] : [...galleryUrlsForProduct(product)];
  const variantIdsByIndex = built.variantIdsByIndex;
  const all = await getMergedCatalog();
  const related = all.filter((p) => p.slug !== product.slug).slice(0, 3);

  const jsonLd = catalogProductJsonLd(product, slug);

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        // JSON-LD for Google rich results (Product + Offer).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView
        product={product}
        gallery={gallery}
        variantIdsByIndex={variantIdsByIndex}
        related={related}
      />
    </main>
  );
}

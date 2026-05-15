import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/shop/product-detail-view";
import { getCatalogProductBySlug, getMergedCatalog } from "@/lib/catalog";
import { buildProductPageMetadata } from "@/lib/product-metadata";
import { catalogProductJsonLd } from "@/lib/product-json-ld";
import { buildPdpGallery } from "@/lib/catalog-style-variants";
import { galleryUrlsForProduct } from "@/lib/site";

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
  return buildProductPageMetadata(product, slug);
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

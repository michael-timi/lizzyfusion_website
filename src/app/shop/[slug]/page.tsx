import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/shop/product-detail-view";
import {
  galleryUrlsForProduct,
  getSampleProductBySlug,
  sampleProducts,
  site,
} from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return sampleProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getSampleProductBySlug(slug);
  if (!product) {
    return { title: "Product" };
  }
  const desc =
    product.description.length > 155 ? `${product.description.slice(0, 155)}…` : product.description;
  return {
    title: `${product.name} · Shop`,
    description: `${desc} Prices in Naira · ${site.name}.`,
  };
}

export default async function ShopProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getSampleProductBySlug(slug);
  if (!product) notFound();

  const gallery = [...galleryUrlsForProduct(product)];
  const related = sampleProducts.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-white">
      <ProductDetailView product={product} gallery={gallery} related={[...related]} />
    </main>
  );
}

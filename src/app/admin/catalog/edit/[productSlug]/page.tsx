import { AdminEditProductView } from "@/components/admin/admin-edit-product-view";

type PageProps = { params: Promise<{ productSlug: string }> };

export default async function AdminCatalogEditPage({ params }: PageProps) {
  const { productSlug } = await params;
  return <AdminEditProductView catalogSlug={decodeURIComponent(productSlug)} />;
}

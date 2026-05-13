import { AdminOrderDetailView } from "@/components/admin/admin-order-detail-view";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminOrderDetailView orderId={id} />;
}

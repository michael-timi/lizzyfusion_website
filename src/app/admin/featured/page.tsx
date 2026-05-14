import { AdminFeaturedView } from "@/components/admin/admin-featured-view";
import { getMergedCatalog } from "@/lib/catalog";
import { getSiteFeatured } from "@/lib/site-featured-server";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const [catalog, featured] = await Promise.all([getMergedCatalog(), getSiteFeatured()]);
  return <AdminFeaturedView catalog={catalog} featured={featured} />;
}

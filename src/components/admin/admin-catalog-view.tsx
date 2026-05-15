import Link from "next/link";
import { AdminCatalogStatusBanner } from "@/components/admin/admin-catalog-status-banner";
import { AdminCatalogTable, type AdminCatalogRow } from "@/components/admin/admin-catalog-table";
import { effectiveCompareAtPrice, catalogDisplayPrice } from "@/lib/catalog-pricing";
import { productHasStyleVariants } from "@/lib/catalog-style-variants";
import {
  getCatalogConnectionStatus,
  getMergedCatalog,
  listFirestoreCatalogProducts,
} from "@/lib/catalog";
import { formatNgn, sampleProducts, site } from "@/lib/site";

export async function AdminCatalogView() {
  const [merged, remoteRows, status] = await Promise.all([
    getMergedCatalog(),
    listFirestoreCatalogProducts(),
    getCatalogConnectionStatus(),
  ]);
  const codeSlugs = new Set<string>(sampleProducts.map((p) => p.slug));
  const remoteSlugs = new Set(remoteRows.map((p) => p.slug));

  const rows: AdminCatalogRow[] = merged.map((p) => {
    const inCode = codeSlugs.has(p.slug);
    const sample = sampleProducts.find((s) => s.slug === p.slug);
    const origin: AdminCatalogRow["origin"] = !inCode
      ? "Firestore only"
      : sample && JSON.stringify(sample) === JSON.stringify(p)
        ? "Code"
        : "Firestore override";
    const displayPrice = catalogDisplayPrice(p);
    const was = effectiveCompareAtPrice(p);
    return {
      slug: p.slug,
      name: p.name,
      tag: p.tag,
      priceLabel: productHasStyleVariants(p) ? `From ${formatNgn(displayPrice)}` : formatNgn(displayPrice),
      priceWasLabel: was !== undefined ? formatNgn(was) : undefined,
      origin,
      hasRemote: remoteSlugs.has(p.slug),
      hasStyleVariants: productHasStyleVariants(p),
    };
  });

  return (
    <div className="space-y-6">
      <AdminCatalogStatusBanner status={status} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Catalogue</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--lf-muted)]">
            Firestore <code className="rounded bg-zinc-100 px-1 text-xs">catalog_products</code> is the source of truth.
            Code defaults from <code className="rounded bg-zinc-100 px-1 text-xs">sampleProducts</code> in{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">src/lib/site.ts</code> only appear here for slugs that
            haven&apos;t been seeded yet — run{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">npm run catalog:seed</code> to migrate them, then edit
            from this page.
          </p>
        </div>
        <Link
          href="/admin/catalog/add"
          className="shrink-0 rounded-full bg-[var(--lf-purple-deep)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
        >
          Add product
        </Link>
      </div>

      <AdminCatalogTable rows={rows} />

      <p className="text-xs text-[var(--lf-muted)]">
        Firestore reads use the Firebase Admin SDK on the server — set{" "}
        <code className="rounded bg-zinc-100 px-1 text-[11px]">FIREBASE_SERVICE_ACCOUNT_PATH</code> (or{" "}
        <code className="rounded bg-zinc-100 px-1 text-[11px]">FIREBASE_SERVICE_ACCOUNT_JSON</code>) on the host so this
        table and {site.name} storefront PDPs stay in sync. Saves invalidate the storefront cache via{" "}
        <code className="rounded bg-zinc-100 px-1 text-[11px]">/api/admin/catalog/revalidate</code> so PDPs refresh
        instantly.
      </p>
    </div>
  );
}

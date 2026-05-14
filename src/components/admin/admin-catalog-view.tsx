import Link from "next/link";
import { AdminCatalogStatusBanner } from "@/components/admin/admin-catalog-status-banner";
import { effectiveCompareAtPrice } from "@/lib/catalog-pricing";
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

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-[800px] w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Origin</th>
              <th className="px-4 py-3">Firestore</th>
              <th className="px-4 py-3">Storefront</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {merged.map((p) => {
              const inCode = codeSlugs.has(p.slug);
              const sample = sampleProducts.find((s) => s.slug === p.slug);
              const origin =
                !inCode ? "Firestore only" : sample && JSON.stringify(sample) === JSON.stringify(p) ? "Code" : "Firestore override";
              const hasRemote = remoteSlugs.has(p.slug);
              const was = effectiveCompareAtPrice(p);
              return (
                <tr key={p.slug} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">{p.slug}</td>
                  <td className="px-4 py-3 font-medium text-[var(--lf-ink)]">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--lf-muted)]">{p.tag}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {was !== undefined ? (
                      <span className="inline-flex flex-col items-end gap-0.5">
                        <span className="text-xs font-medium text-zinc-500 line-through">{formatNgn(was)}</span>
                        <span className="text-[var(--lf-ink)]">{formatNgn(p.price)}</span>
                      </span>
                    ) : (
                      formatNgn(p.price)
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--lf-muted)]">{origin}</td>
                  <td className="px-4 py-3">
                    {hasRemote ? (
                      <Link
                        href={`/admin/catalog/edit/${encodeURIComponent(p.slug)}`}
                        className="font-semibold text-[var(--lf-purple)] hover:underline"
                      >
                        Edit
                      </Link>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/shop/${p.slug}`} className="font-semibold text-[var(--lf-purple)] hover:underline">
                      View PDP
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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

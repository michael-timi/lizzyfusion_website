import Link from "next/link";
import { getMergedCatalog, listFirestoreCatalogProducts } from "@/lib/catalog";
import { formatNgn, sampleProducts, site } from "@/lib/site";

export async function AdminCatalogView() {
  const [merged, remoteRows] = await Promise.all([getMergedCatalog(), listFirestoreCatalogProducts()]);
  const codeSlugs = new Set<string>(sampleProducts.map((p) => p.slug));
  const remoteSlugs = new Set(remoteRows.map((p) => p.slug));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Catalogue</h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--lf-muted)]">
            Merged list: defaults from <code className="rounded bg-zinc-100 px-1 text-xs">sampleProducts</code> in{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">src/lib/site.ts</code>, plus Firestore{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">catalog_products</code>. Same slug in both → Firestore
            wins on the storefront.
          </p>
        </div>
        <Link
          href="/admin/catalog/new"
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
              return (
                <tr key={p.slug} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">{p.slug}</td>
                  <td className="px-4 py-3 font-medium text-[var(--lf-ink)]">{p.name}</td>
                  <td className="px-4 py-3 text-[var(--lf-muted)]">{p.tag}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{formatNgn(p.price)}</td>
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
        Server merge needs Firebase env on the host for Firestore rows to appear here and on {site.name}. Without it,
        only code defaults are listed. Sitemap includes merged PDP URLs when the server can read Firestore.
      </p>
    </div>
  );
}

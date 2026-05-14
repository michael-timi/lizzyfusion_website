import type { CatalogConnectionStatus } from "@/lib/catalog";

/**
 * Diagnostic banner at the top of /admin/catalog. Surfaces Firebase Admin credential / Firestore
 * reachability issues so the studio sees *why* the storefront would 404 on a freshly added product
 * (most common cause: `FIREBASE_SERVICE_ACCOUNT_PATH` not configured on the server).
 *
 * Healthy state: subtle inline pill — does not crowd the actual catalogue table.
 * Broken state: prominent card with the underlying detail and concrete remediation steps.
 */
export function AdminCatalogStatusBanner({ status }: { status: CatalogConnectionStatus }) {
  if (status.ok) {
    const credLine =
      status.credStatus.via === "path"
        ? `via FIREBASE_SERVICE_ACCOUNT_PATH (${status.credStatus.path})`
        : "via inline FIREBASE_SERVICE_ACCOUNT_JSON";
    return (
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-sm"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-600"
        />
        <span className="font-semibold text-emerald-900">Firebase Admin connected</span>
        <span className="text-emerald-800/90">
          {status.productCount} {status.productCount === 1 ? "product" : "products"} in Firestore ·
          storefront PDPs will resolve immediately after each save.
        </span>
        <span className="text-xs text-emerald-800/70">{credLine}</span>
      </div>
    );
  }

  if (status.kind === "no-credentials") {
    const cred = status.credStatus;
    return (
      <div
        className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white"
          >
            !
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold text-amber-900">
              Firebase Admin credentials are not configured on this server.
            </p>
            <p className="text-sm leading-relaxed text-amber-900/90">
              Without admin credentials, the storefront falls back to the code-default sample
              products. Newly added catalogue items in Firestore will <strong>404</strong> on{" "}
              <code className="rounded bg-amber-100 px-1 text-xs">/shop/[slug]</code> until you
              configure credentials and restart the server.
            </p>
            <p className="text-xs leading-relaxed text-amber-900/80">{cred.detail}</p>
            <details className="rounded-lg border border-amber-200 bg-white/60 px-3 py-2 text-xs text-amber-950 open:bg-white/80">
              <summary className="cursor-pointer font-semibold">How to fix</summary>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                <li>
                  Open Firebase Console → Project settings → Service accounts → Generate new private
                  key. Save the downloaded JSON somewhere safe (e.g.{" "}
                  <code className="rounded bg-amber-100 px-1">~/.lizzy-fusion/serviceAccount.json</code>).
                </li>
                <li>
                  In <code className="rounded bg-amber-100 px-1">.env.local</code> at the repo root,
                  add:{" "}
                  <code className="block mt-1 rounded bg-amber-100 px-2 py-1">
                    FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccount.json
                  </code>
                </li>
                <li>
                  Restart the dev server (
                  <code className="rounded bg-amber-100 px-1">npm run dev</code>) and refresh this
                  page — the banner should turn green.
                </li>
                <li>
                  Optional: run <code className="rounded bg-amber-100 px-1">npm run catalog:seed</code>{" "}
                  once to push the code-default sample products into Firestore so admin owns the
                  whole catalogue.
                </li>
              </ol>
            </details>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-red-300 bg-red-50/80 p-4 shadow-sm"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white"
        >
          !
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-red-900">
            Firestore read failed (credentials are configured).
          </p>
          <p className="text-sm leading-relaxed text-red-900/90">
            firebase-admin initialized but the catalogue read threw. The storefront table below
            shows the cached or fallback state. Likely causes: the service account does not belong
            to the same Firebase project as <code className="rounded bg-red-100 px-1 text-xs">NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>,
            the project has no default Firestore database yet, or the IAM role is missing{" "}
            <code className="rounded bg-red-100 px-1 text-xs">datastore.user</code>.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-red-100/70 px-3 py-2 text-xs leading-snug text-red-950">
            {status.detail}
          </pre>
        </div>
      </div>
    </div>
  );
}

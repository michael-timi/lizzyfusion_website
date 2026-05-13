import { firebaseProjectId } from "@/lib/firebase";
import { publicSiteUrl, site } from "@/lib/site";

export function AdminSettingsView() {
  const url = publicSiteUrl();
  const hasFirebase =
    typeof process !== "undefined" &&
    Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Studio settings</h2>
        <p className="mt-1 text-sm text-[var(--lf-muted)]">
          Deployment and integration checklist for {site.name}. This page is static reference—secrets stay in env files.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Environment</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-[var(--lf-muted)]">Public site URL</dt>
            <dd className="mt-0.5 font-mono text-xs text-[var(--lf-ink)]">{url}</dd>
          </div>
          <div>
            <dt className="text-[var(--lf-muted)]">Firebase web SDK</dt>
            <dd className="mt-0.5 text-[var(--lf-ink)]">
              {hasFirebase ? "Public keys detected in this build." : "Not detected in build-time env (expected in client)."}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--lf-muted)]">Project id (code default)</dt>
            <dd className="mt-0.5 font-mono text-xs">{firebaseProjectId}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Admin access</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--lf-muted)]">
          <li>Sign in with Firebase Auth (Google or email).</li>
          <li>
            In Firebase console → Firestore → <code className="rounded bg-zinc-100 px-1">users/{`{uid}`}</code> set{" "}
            <code className="rounded bg-zinc-100 px-1">userType</code> to <code className="rounded bg-zinc-100 px-1">admin</code>.
          </li>
          <li>Deploy updated <code className="rounded bg-zinc-100 px-1">firestore.rules</code> so admins can list orders.</li>
        </ol>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Brand contact (site.ts)</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--lf-muted)]">WhatsApp</dt>
            <dd className="font-medium">{site.contact.phoneDisplay}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--lf-muted)]">Email</dt>
            <dd className="font-medium">{site.contact.email}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

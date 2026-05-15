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
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Custom domain (App Hosting)</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--lf-muted)]">
          After the domain shows <strong className="font-semibold text-[var(--lf-ink)]">Connected</strong> in Firebase, finish these or Google
          sign-in can still fail on the live site.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--lf-muted)]">
          <li>
            Firebase console → <strong className="text-[var(--lf-ink)]">App Hosting</strong> → your backend →{" "}
            <strong className="text-[var(--lf-ink)]">Environment</strong> → set{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">NEXT_PUBLIC_SITE_URL</code> to{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">https://your-domain.com</code> (HTTPS, no trailing slash). Trigger a new rollout
            so the client bundle picks it up.
          </li>
          <li>
            <strong className="text-[var(--lf-ink)]">Authentication</strong> → Settings → <strong className="text-[var(--lf-ink)]">Authorized domains</strong>:
            add both apex and <code className="rounded bg-zinc-100 px-1 text-xs">www</code> if you use both.
          </li>
          <li>
            <strong className="text-[var(--lf-ink)]">Google Cloud Console</strong> (same project) → APIs &amp; Services → Credentials → your{" "}
            <strong className="text-[var(--lf-ink)]">OAuth 2.0 Web client</strong> → <strong className="text-[var(--lf-ink)]">Authorized JavaScript origins</strong>:
            add <code className="rounded bg-zinc-100 px-1 text-xs">https://your-domain.com</code> (and <code className="rounded bg-zinc-100 px-1 text-xs">www</code> if applicable).
          </li>
          <li>
            If the Firebase <strong className="text-[var(--lf-ink)]">Browser API key</strong> uses HTTP referrer restrictions, add your production origin
            (and optionally the <code className="rounded bg-zinc-100 px-1 text-xs">*.hosted.app</code> preview URL) to the allowed referrers list.
          </li>
        </ol>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Catalogue hero (Gemini / Nano Banana 2)</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--lf-muted)]">
          “Add product” uses <code className="rounded bg-zinc-100 px-1 text-xs">/api/admin/catalog/suggest-from-hero</code> (Gemini vision,{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">gemini-2.5-flash</code>) to prefill copy from the mannequin hero, and optionally{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs">/api/admin/catalog/hero-image</code> to generate a new hero from an original garment
          photo. Configure the server (e.g. <code className="rounded bg-zinc-100 px-1 text-xs">.env.local</code>):
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--lf-muted)]">
          <li>
            <code className="rounded bg-zinc-100 px-1 text-xs">GEMINI_API_KEY</code> — from{" "}
            <a href="https://aistudio.google.com/apikey" className="font-semibold text-[var(--lf-purple)] underline">
              Google AI Studio → API keys
            </a>
            .
          </li>
          <li>
            <code className="rounded bg-zinc-100 px-1 text-xs">FIREBASE_SERVICE_ACCOUNT_JSON</code> (one-line JSON) or{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">FIREBASE_SERVICE_ACCOUNT_PATH</code> (absolute path to the downloaded{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">.json</code>) — same service account as Firebase → Project settings → Service
            accounts. Server-only: verify ID token + read <code className="rounded bg-zinc-100 px-1 text-xs">users/{`{uid}`}</code> for{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs">userType: admin</code>.
          </li>
          <li>
            <strong className="text-[var(--lf-ink)]">Quotas:</strong> image models have strict free-tier limits. If you see rate limit or 429
            errors, wait and retry, check usage in AI Studio, or enable billing / a paid tier — see{" "}
            <a href="https://ai.google.dev/gemini-api/docs/rate-limits" className="font-semibold text-[var(--lf-purple)] underline">
              rate limits
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--lf-ink)]">Admin access</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--lf-muted)]">
          <li>Sign in with Firebase Auth (Google or email).</li>
          <li>
            In Firebase console → Firestore → <code className="rounded bg-zinc-100 px-1">users/{`{uid}`}</code> set{" "}
            <code className="rounded bg-zinc-100 px-1">userType</code> to the string <code className="rounded bg-zinc-100 px-1">admin</code>{" "}
            (all lowercase — Firestore rules compare exactly).
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

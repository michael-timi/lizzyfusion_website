"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthErrorBanner, AuthSuccessBanner } from "@/components/auth/auth-feedback";
import {
  AdminFilterPills,
  AdminPanel,
  AdminQuickAction,
  AdminStatCard,
} from "@/components/admin/admin-ui";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { formatFirestoreTime } from "@/lib/admin-firestore";
import type { BlogPostDoc } from "@/lib/blog-types";
import {
  deleteBlogPostAdmin,
  ensureUniqueSlug,
  saveBlogPostAdmin,
  slugifyTitle,
  subscribeAllPostsForAdmin,
} from "@/lib/blog-firestore";

const inputClass = "input";

type PostRow = { id: string; data: BlogPostDoc };

type PublishFilter = "all" | "published" | "draft";

const emptyForm = (): Pick<BlogPostDoc, "title" | "slug" | "excerpt" | "body" | "published" | "heroImage"> => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  published: false,
  heroImage: "",
});

function IconJournal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 4h9l3 3v13H6V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M15 4v3h3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconLive() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PublishBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
      Live
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950">
      Draft
    </span>
  );
}

export function AdminBlogPage() {
  const { user } = useFirebaseAuth();
  const [rows, setRows] = useState<PostRow[]>([]);
  const [listErr, setListErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeAllPostsForAdmin(
      (r) => {
        setListErr(null);
        setRows(r);
      },
      (e) => setListErr(e.message),
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const stats = useMemo(() => {
    let published = 0;
    let draft = 0;
    for (const { data } of rows) {
      if (data.published) published += 1;
      else draft += 1;
    }
    return { total: rows.length, published, draft };
  }, [rows]);

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "All", count: rows.length },
      { value: "published", label: "Live", count: stats.published },
      { value: "draft", label: "Drafts", count: stats.draft },
    ],
    [rows.length, stats.published, stats.draft],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(({ data }) => {
      if (publishFilter === "published" && !data.published) return false;
      if (publishFilter === "draft" && data.published) return false;
      if (!q) return true;
      const hay = `${data.title} ${data.slug} ${data.excerpt}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, publishFilter, search]);

  function selectPost(id: string, data: BlogPostDoc) {
    setIsNew(false);
    setEditingId(id);
    setForm({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      published: data.published,
      heroImage: data.heroImage ?? "",
    });
    setFeedback(null);
    setError(null);
  }

  function startNew() {
    setIsNew(true);
    setEditingId(null);
    setForm(emptyForm());
    setFeedback(null);
    setError(null);
  }

  async function handleSave() {
    if (!user) return;
    setError(null);
    setFeedback(null);
    const title = form.title.trim();
    const body = form.body.trim();
    if (!title || !body) {
      setError("Title and body are required.");
      return;
    }
    let slug = form.slug.trim() ? slugifyTitle(form.slug.trim()) : slugifyTitle(title);
    if (!slug) slug = "article";
    if (isNew) {
      slug = await ensureUniqueSlug(slug);
    } else if (editingId && slug !== editingId) {
      setError("Slug cannot be changed when editing. Duplicate the article as a new post if you need a new URL.");
      return;
    }
    const slugFinal = isNew ? slug : editingId!;
    setSaving(true);
    try {
      const res = await saveBlogPostAdmin(
        slugFinal,
        {
          title,
          slug: slugFinal,
          excerpt: form.excerpt.trim(),
          body,
          published: form.published,
          heroImage: form.heroImage?.trim() ?? "",
        },
        user,
        isNew,
      );
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setFeedback(isNew ? "Article saved to Firestore." : "Article updated.");
      setIsNew(false);
      setEditingId(slugFinal);
      setForm((f) => ({ ...f, slug: slugFinal }));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingId || isNew) return;
    if (!window.confirm(`Delete “${form.title}” and all likes and comments? This cannot be undone.`)) return;
    setSaving(true);
    setError(null);
    const res = await deleteBlogPostAdmin(editingId);
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setFeedback("Article deleted.");
    startNew();
  }

  const editorActive = isNew || Boolean(editingId);
  const previewSlug = isNew ? (form.slug.trim() ? slugifyTitle(form.slug) : slugifyTitle(form.title)) : editingId;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-900 via-[var(--lf-purple-deep)] to-[var(--lf-purple)] px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/75">Content</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Journal</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85">
              Write studio stories for the storefront. Published posts appear on{" "}
              <Link href="/blog" className="font-semibold underline underline-offset-2 hover:text-white">
                /blog
              </Link>
              ; drafts stay admin-only until you toggle Live.
            </p>
          </div>
          <button
            type="button"
            onClick={startNew}
            className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[var(--lf-purple-deep)] shadow-sm transition hover:bg-violet-50"
          >
            New article
          </button>
        </div>
      </section>

      {listErr ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {listErr}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="All posts" value={stats.total} hint="In Firestore" accent="purple" icon={<IconJournal />} />
        <AdminStatCard label="Live on site" value={stats.published} hint="Visible on /blog" accent="emerald" icon={<IconLive />} />
        <AdminStatCard label="Drafts" value={stats.draft} hint="Not published yet" accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <AdminPanel
          title="Articles"
          action={
            <span className="text-xs tabular-nums text-[var(--lf-muted)]">{filteredRows.length} shown</span>
          }
        >
          <label className="block">
            <span className="sr-only">Search articles</span>
            <input
              type="search"
              className={`${inputClass} w-full`}
              placeholder="Search title or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="mt-4">
            <AdminFilterPills
              options={filterOptions}
              value={publishFilter}
              onChange={(v) => setPublishFilter(v as PublishFilter)}
              label="Show"
            />
          </div>
          <ul className="mt-4 max-h-[min(65vh,28rem)] space-y-1 overflow-y-auto pr-1">
            {filteredRows.length === 0 ? (
              <li className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-[var(--lf-muted)]">
                {rows.length === 0 ? "No articles yet — start with New article." : "No posts match this filter."}
              </li>
            ) : (
              filteredRows.map(({ id, data }) => {
                const selected = editingId === id && !isNew;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => selectPost(id, data)}
                      className={`flex w-full flex-col gap-1 rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-[var(--lf-purple-deep)] bg-[var(--lf-purple-faint)] shadow-sm"
                          : "border-transparent hover:border-violet-100 hover:bg-violet-50/50"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-semibold text-[var(--lf-ink)]">{data.title}</span>
                        <PublishBadge published={data.published} />
                      </span>
                      <span className="font-mono text-[11px] text-[var(--lf-muted)]">/blog/{id}</span>
                      <span className="text-[11px] text-[var(--lf-muted)]">
                        {formatFirestoreTime(data.updatedAt ?? data.createdAt)}
                        {data.authorName ? ` · ${data.authorName}` : ""}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </AdminPanel>

        <div className="space-y-4">
          {previewSlug && form.published ? (
            <AdminQuickAction
              href={`/blog/${previewSlug}`}
              label="Preview on storefront"
              description="Open the live article in a new tab"
              accent="sky"
              external
            />
          ) : null}

          <AdminPanel
            title={isNew ? "New article" : editingId ? `Edit · /blog/${editingId}` : "Editor"}
            action={
              editorActive && previewSlug ? (
                <PublishBadge published={form.published} />
              ) : null
            }
          >
            {feedback ? (
              <div className="mb-4">
                <AuthSuccessBanner>{feedback}</AuthSuccessBanner>
              </div>
            ) : null}
            {error ? (
              <div className="mb-4">
                <AuthErrorBanner>{error}</AuthErrorBanner>
              </div>
            ) : null}

            {editorActive ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="blog-title">
                    Title
                  </label>
                  <input
                    id="blog-title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className={`${inputClass} mt-1.5`}
                    placeholder="e.g. How we fit aso-ebi in Osogbo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="blog-slug">
                    URL slug {isNew ? "(optional)" : "(fixed)"}
                  </label>
                  <input
                    id="blog-slug"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    disabled={!isNew && Boolean(editingId)}
                    placeholder={isNew ? "auto-from-title" : undefined}
                    className={`${inputClass} mt-1.5 font-mono text-sm disabled:bg-zinc-100`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="blog-excerpt">
                    Excerpt
                  </label>
                  <textarea
                    id="blog-excerpt"
                    value={form.excerpt}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    rows={2}
                    className={`${inputClass} mt-1.5 min-h-[72px] resize-y`}
                    placeholder="Short teaser for the blog index and social sharing"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="blog-hero">
                    Hero image URL (optional)
                  </label>
                  <input
                    id="blog-hero"
                    type="url"
                    value={form.heroImage}
                    onChange={(e) => setForm((f) => ({ ...f, heroImage: e.target.value }))}
                    placeholder="https://images.unsplash.com/…"
                    className={`${inputClass} mt-1.5`}
                  />
                  {form.heroImage?.trim().startsWith("https://") ? (
                    <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.heroImage.trim()} alt="" className="max-h-40 w-full object-cover" />
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--lf-muted)]">HTTPS only; Unsplash URLs work with this site.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]" htmlFor="blog-body">
                    Body
                  </label>
                  <textarea
                    id="blog-body"
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    rows={14}
                    className={`${inputClass} mt-1.5 min-h-[280px] resize-y font-mono text-sm leading-relaxed`}
                    placeholder="Write in plain text or light markdown-style paragraphs…"
                  />
                  <p className="mt-1 text-xs text-[var(--lf-muted)]">
                    {form.body.trim().split(/\s+/).filter(Boolean).length} words (approx.)
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-violet-200/80 bg-violet-50/50 px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--lf-purple-deep)]"
                    checked={form.published}
                    onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-[var(--lf-ink)]">Publish to storefront</span>
                    <span className="block text-xs text-[var(--lf-muted)]">When on, the post is visible at /blog/[slug]</span>
                  </span>
                </label>
                <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-4">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="rounded-full bg-[var(--lf-purple-deep)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--lf-purple)] disabled:opacity-50"
                  >
                    {saving ? "Saving…" : isNew ? "Create article" : "Save changes"}
                  </button>
                  {!isNew && editingId ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleDelete()}
                      className="rounded-full border border-red-200 bg-white px-6 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={startNew}
                    className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center">
                <p className="font-serif text-lg font-semibold text-[var(--lf-ink)]">Select an article</p>
                <p className="mt-2 text-sm text-[var(--lf-muted)]">
                  Pick a post from the list, or create a new one to start writing.
                </p>
                <button
                  type="button"
                  onClick={startNew}
                  className="mt-6 rounded-full bg-[var(--lf-purple)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--lf-purple-deep)]"
                >
                  New article
                </button>
              </div>
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  );
}

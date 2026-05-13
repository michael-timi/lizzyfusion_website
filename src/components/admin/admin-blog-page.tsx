"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthErrorBanner, AuthSuccessBanner } from "@/components/auth/auth-feedback";
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

const emptyForm = (): Pick<BlogPostDoc, "title" | "slug" | "excerpt" | "body" | "published" | "heroImage"> => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  published: false,
  heroImage: "",
});

export function AdminBlogPage() {
  const { user } = useFirebaseAuth();
  const [rows, setRows] = useState<{ id: string; data: BlogPostDoc }[]>([]);
  const [listErr, setListErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      setFeedback(isNew ? "Article published to Firestore." : "Article updated.");
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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Journal</h2>
          <p className="mt-1 max-w-xl text-sm text-[var(--lf-muted)]">
            Articles appear on the storefront <Link href="/blog" className="font-semibold text-[var(--lf-purple)] underline">/blog</Link> when marked published.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="shrink-0 rounded-full bg-[var(--lf-purple)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--lf-purple-deep)]"
        >
          New article
        </button>
      </div>

      {listErr ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {listErr}
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">All posts</p>
          <ul className="mt-3 max-h-[min(70vh,32rem)] space-y-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2">
            {rows.map(({ id, data }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => selectPost(id, data)}
                  className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm transition ${
                    editingId === id && !isNew ? "bg-[var(--lf-purple-faint)] font-semibold" : "hover:bg-zinc-50"
                  }`}
                >
                  <span className="line-clamp-2 text-[var(--lf-ink)]">{data.title}</span>
                  <span className="mt-0.5 text-xs text-[var(--lf-muted)]">
                    {data.published ? "Live" : "Draft"} · {formatFirestoreTime(data.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            {isNew ? "New article" : editingId ? `Edit · /blog/${editingId}` : "Select or create"}
          </p>

          {feedback ? (
            <div className="mt-4">
              <AuthSuccessBanner>{feedback}</AuthSuccessBanner>
            </div>
          ) : null}
          {error ? (
            <div className="mt-4">
              <AuthErrorBanner>{error}</AuthErrorBanner>
            </div>
          ) : null}

          {isNew || editingId ? (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[var(--lf-purple)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  URL slug {isNew ? "(optional; generated from title if empty)" : "(fixed)"}
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  disabled={!isNew && Boolean(editingId)}
                  className="mt-1 w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[var(--lf-purple)] disabled:bg-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Excerpt</label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[var(--lf-purple)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  Hero image URL (optional)
                </label>
                <input
                  type="url"
                  value={form.heroImage}
                  onChange={(e) => setForm((f) => ({ ...f, heroImage: e.target.value }))}
                  placeholder="https://images.unsplash.com/…"
                  className="mt-1 w-full border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[var(--lf-purple)]"
                />
                <p className="mt-1 text-xs text-[var(--lf-muted)]">HTTPS image; Unsplash URLs work with this site&apos;s image config.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">Body</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  rows={14}
                  className="mt-1 w-full border border-zinc-200 px-3 py-2 font-mono text-sm outline-none focus:border-[var(--lf-purple)]"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--lf-ink)]">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                />
                Published (visible on /blog)
              </label>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="rounded-full bg-[var(--lf-purple)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--lf-purple-deep)] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                {!isNew && editingId ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleDelete()}
                    className="rounded-full border border-red-200 px-6 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-[var(--lf-muted)]">Choose a post from the list or start a new article.</p>
          )}
        </div>
      </div>
    </div>
  );
}

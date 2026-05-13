"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CraftCareBreadcrumb } from "@/components/craft-care/craft-care-breadcrumb";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { AuthErrorBanner } from "@/components/auth/auth-feedback";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";
import { formatFirestoreTime } from "@/lib/admin-firestore";
import type { BlogCommentDoc, BlogPostDoc } from "@/lib/blog-types";
import {
  addComment,
  deleteCommentCascade,
  fetchPostBySlug,
  removeLike,
  setLike,
  subscribeComments,
  subscribeLikes,
  updateCommentBody,
} from "@/lib/blog-firestore";
import { site } from "@/lib/site";

const body = "text-sm leading-relaxed text-[var(--lf-ink)] sm:text-[15px]";

type Row = { id: string; data: BlogCommentDoc };

function buildThreads(flat: Row[]): { thread: Row; replies: Row[] }[] {
  const tops = flat.filter((r) => !r.data.parentCommentId);
  const rest = flat.filter((r) => r.data.parentCommentId);
  return tops.map((thread) => ({
    thread,
    replies: rest.filter((r) => r.data.parentCommentId === thread.id),
  }));
}

export function BlogPostView({ slug }: { slug: string }) {
  const { user, configured, isAdmin } = useFirebaseAuth();
  const [post, setPost] = useState<{ id: string; data: BlogPostDoc } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [likeUids, setLikeUids] = useState<string[]>([]);
  const [comments, setComments] = useState<Row[]>([]);
  const [commentErr, setCommentErr] = useState<string | null>(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const [newBody, setNewBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadErr(null);
      const row = await fetchPostBySlug(slug);
      if (cancelled) return;
      if (!row) {
        setPost(null);
        setLoadErr("This article could not be found.");
        return;
      }
      if (!row.data.published && !isAdmin) {
        setPost(null);
        setLoadErr("This article is not published yet.");
        return;
      }
      setPost(row);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, isAdmin]);

  useEffect(() => {
    if (!post?.id) return;
    const unsubL = subscribeLikes(
      post.id,
      (uids) => setLikeUids(uids),
      () => setLikeUids([]),
    );
    const unsubC = subscribeComments(
      post.id,
      (rows) => setComments(rows),
      () => setComments([]),
    );
    return () => {
      if (unsubL) unsubL();
      if (unsubC) unsubC();
    };
  }, [post?.id]);

  const liked = user ? likeUids.includes(user.uid) : false;
  const threads = useMemo(() => buildThreads(comments), [comments]);

  async function toggleLike() {
    if (!user || !post) return;
    setLikeBusy(true);
    setCommentErr(null);
    try {
      if (liked) await removeLike(post.id, user.uid);
      else await setLike(post.id, user.uid);
    } catch (e) {
      setCommentErr(e instanceof Error ? e.message : "Could not update like.");
    } finally {
      setLikeBusy(false);
    }
  }

  async function submitComment(parentId: string | null, bodyText: string, clear: () => void) {
    if (!user || !post) return;
    const t = bodyText.trim();
    if (t.length < 1) {
      setCommentErr("Please write something before posting.");
      return;
    }
    setSubmitting(true);
    setCommentErr(null);
    try {
      await addComment(post.id, user, t, parentId);
      clear();
      setReplyTo(null);
      setReplyBody("");
    } catch (e) {
      setCommentErr(e instanceof Error ? e.message : "Could not post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(commentId: string) {
    if (!post) return;
    const t = editBody.trim();
    if (t.length < 1) return;
    setSubmitting(true);
    setCommentErr(null);
    try {
      await updateCommentBody(post.id, commentId, t);
      setEditingId(null);
    } catch (e) {
      setCommentErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSubmitting(false);
    }
  }

  async function removeThread(commentId: string) {
    if (!post || !user) return;
    setSubmitting(true);
    setCommentErr(null);
    try {
      await deleteCommentCascade(post.id, commentId, user.uid, isAdmin);
    } catch (e) {
      setCommentErr(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadErr && !post) {
    return (
      <main className="bg-white pb-24">
        <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6">
          <CraftCareBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Journal", href: "/blog" }, { label: "Article" }]} />
          <p className="mt-8 text-sm text-[var(--lf-muted)]">{loadErr}</p>
          <Link href="/blog" className="mt-6 inline-block text-sm font-semibold text-[var(--lf-purple)]">
            ← Back to Journal
          </Link>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="bg-white pb-24">
        <div className="mx-auto max-w-[900px] px-4 py-16 text-sm text-[var(--lf-muted)] sm:px-6">Loading…</div>
      </main>
    );
  }

  const { data } = post;

  return (
    <main className="bg-white pb-24">
      <article className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:max-w-[960px] lg:py-12">
        <CraftCareBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Journal", href: "/blog" },
            { label: data.title },
          ]}
        />

        {data.heroImage ? (
          <div className="relative mt-8 aspect-[21/9] max-h-[min(22rem,50vh)] w-full overflow-hidden bg-zinc-100">
            <LfRemoteImage
              src={data.heroImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 900px) 100vw, 900px"
              priority
            />
          </div>
        ) : null}

        <header className="mt-8 border-b border-[var(--lf-line)] pb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
            {formatFirestoreTime(data.createdAt)} · {data.authorName}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-5xl">
            {data.title}
          </h1>
          {data.excerpt ? <p className={`mt-4 max-w-2xl ${body} text-[var(--lf-muted)]`}>{data.excerpt}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={!user || likeBusy || !configured}
              onClick={() => void toggleLike()}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--lf-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] disabled:opacity-50"
            >
              <span aria-hidden>{liked ? "♥" : "♡"}</span>
              {likeUids.length} {likeUids.length === 1 ? "like" : "likes"}
            </button>
            {!user ? (
              <span className="text-xs text-[var(--lf-muted)]">
                <Link href={`/login?next=${encodeURIComponent(`/blog/${slug}`)}`} className="font-semibold text-[var(--lf-purple)] underline-offset-2 hover:underline">
                  Log in
                </Link>{" "}
                to like or comment.
              </span>
            ) : null}
          </div>
        </header>

        <div className={`prose-blog mt-10 whitespace-pre-wrap ${body}`}>{data.body}</div>

        <section className="mt-16 border-t border-[var(--lf-line)] pt-10">
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">Comments</h2>
          {commentErr ? (
            <div className="mt-4">
              <AuthErrorBanner>{commentErr}</AuthErrorBanner>
            </div>
          ) : null}

          {user ? (
            <form
              className="mt-6 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void submitComment(null, newBody, () => setNewBody(""));
              }}
            >
              <label htmlFor="blog-comment" className="sr-only">
                Your comment
              </label>
              <textarea
                id="blog-comment"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                rows={4}
                placeholder={`Share a thought about this piece… (${site.name} reads every note.)`}
                className="w-full border border-[var(--lf-ink)] bg-white px-4 py-3 text-sm text-[var(--lf-ink)] outline-none placeholder:text-zinc-400 focus:border-[var(--lf-purple)] focus:ring-1 focus:ring-[var(--lf-purple)]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-[var(--lf-purple)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple-deep)] disabled:opacity-60"
              >
                {submitting ? "Posting…" : "Post comment"}
              </button>
            </form>
          ) : (
            <p className={`mt-6 ${body} text-[var(--lf-muted)]`}>
              <Link href={`/login?next=${encodeURIComponent(`/blog/${slug}`)}`} className="font-semibold text-[var(--lf-purple)] underline-offset-2 hover:underline">
                Log in
              </Link>{" "}
              or{" "}
              <Link href={`/register?next=${encodeURIComponent(`/blog/${slug}`)}`} className="font-semibold text-[var(--lf-purple)] underline-offset-2 hover:underline">
                create an account
              </Link>{" "}
              to join the discussion.
            </p>
          )}

          <ul className="mt-10 space-y-8">
            {threads.map(({ thread, replies }) => (
              <li key={thread.id} className="border border-[var(--lf-line)] bg-zinc-50 px-5 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                  {thread.data.authorDisplayName} · {formatFirestoreTime(thread.data.createdAt)}
                </p>
                {editingId === thread.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      className="w-full border border-[var(--lf-ink)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--lf-purple)]"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void saveEdit(thread.id)}
                        className="text-sm font-semibold text-[var(--lf-purple)]"
                      >
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="text-sm text-[var(--lf-muted)]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`mt-2 ${body}`}>{thread.data.body}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo((r) => (r === thread.id ? null : thread.id));
                        setReplyBody("");
                      }}
                      className="font-semibold text-[var(--lf-purple)]"
                    >
                      {replyTo === thread.id ? "Cancel reply" : "Reply"}
                    </button>
                  ) : null}
                  {user && (user.uid === thread.data.authorUid || isAdmin) && editingId !== thread.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(thread.id);
                          setEditBody(thread.data.body);
                        }}
                        className="font-semibold text-[var(--lf-muted)] hover:text-[var(--lf-ink)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeThread(thread.id)}
                        className="font-semibold text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>

                {replyTo === thread.id && user ? (
                  <form
                    className="mt-4 space-y-2 border-t border-zinc-200 pt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submitComment(thread.id, replyBody, () => setReplyBody(""));
                    }}
                  >
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={3}
                      placeholder="Write a reply…"
                      className="w-full border border-[var(--lf-ink)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--lf-purple)]"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="text-sm font-semibold text-[var(--lf-purple)] disabled:opacity-50"
                    >
                      {submitting ? "Posting…" : "Post reply"}
                    </button>
                  </form>
                ) : null}

                {replies.length > 0 ? (
                  <ul className="mt-4 space-y-4 border-l-2 border-[var(--lf-purple-faint)] pl-4">
                    {replies.map((r) => (
                      <li key={r.id}>
                        <p className="text-xs font-semibold text-[var(--lf-muted)]">
                          {r.data.authorDisplayName} · {formatFirestoreTime(r.data.createdAt)}
                        </p>
                        {editingId === r.id ? (
                          <div className="mt-1 space-y-2">
                            <textarea
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              rows={2}
                              className="w-full border border-[var(--lf-ink)] bg-white px-3 py-2 text-sm outline-none"
                            />
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void saveEdit(r.id)}
                              className="text-xs font-semibold text-[var(--lf-purple)]"
                            >
                              Save
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="ml-2 text-xs text-[var(--lf-muted)]">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className={`mt-1 text-sm ${body}`}>{r.data.body}</p>
                        )}
                        {user && (user.uid === r.data.authorUid || isAdmin) && editingId !== r.id ? (
                          <div className="mt-1 flex gap-3 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(r.id);
                                setEditBody(r.data.body);
                              }}
                              className="font-semibold text-[var(--lf-muted)]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeThread(r.id)}
                              className="font-semibold text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}

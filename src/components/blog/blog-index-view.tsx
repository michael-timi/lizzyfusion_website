"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CraftCareBreadcrumb } from "@/components/craft-care/craft-care-breadcrumb";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";
import { formatFirestoreTime } from "@/lib/admin-firestore";
import type { BlogPostDoc } from "@/lib/blog-types";
import { subscribePublishedPosts } from "@/lib/blog-firestore";
import { site } from "@/lib/site";

const body = "text-sm leading-relaxed text-[var(--lf-ink)] sm:text-[15px]";

export function BlogIndexView() {
  const [posts, setPosts] = useState<{ id: string; data: BlogPostDoc }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribePublishedPosts(
      (rows) => {
        setErr(null);
        setPosts(rows);
      },
      (e) => setErr(e.message),
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <main className="bg-white pb-24">
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:max-w-[960px] lg:py-12">
        <CraftCareBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Journal" }]} />

        <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-5xl">
          Journal
        </h1>
        <p className={`mt-4 max-w-2xl ${body} text-[var(--lf-muted)]`}>
          Studio notes, modest styling ideas, and behind-the-scenes from {site.name}. Sign in to like articles and join
          the conversation.
        </p>

        {err ? (
          <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {err}
          </p>
        ) : null}

        <ul className="mt-12 space-y-6">
          {posts.length === 0 && !err ? (
            <li className={`border border-[var(--lf-line)] bg-zinc-50 px-6 py-10 text-center ${body} text-[var(--lf-muted)]`}>
              New stories will appear here soon.
            </li>
          ) : null}
          {posts.map(({ id, data }) => (
            <li key={id} className="border border-[var(--lf-line)] bg-zinc-50 transition hover:border-[var(--lf-purple)]">
              <Link href={`/blog/${id}`} className="flex flex-col sm:flex-row sm:gap-0">
                {data.heroImage ? (
                  <div className="relative aspect-[16/10] w-full shrink-0 sm:aspect-auto sm:h-48 sm:w-56">
                    <LfRemoteImage
                      src={data.heroImage}
                      alt=""
                      fill
                      className="object-cover sm:rounded-l-sm"
                      sizes="(max-width: 640px) 100vw, 14rem"
                    />
                  </div>
                ) : null}
                <div className={`flex flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 ${data.heroImage ? "" : "w-full"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--lf-muted)]">
                    {formatFirestoreTime(data.createdAt)}
                  </p>
                  <h2 className="mt-2 font-serif text-xl font-semibold text-[var(--lf-ink)] sm:text-2xl">{data.title}</h2>
                  {data.excerpt ? <p className={`mt-3 ${body} text-[var(--lf-muted)]`}>{data.excerpt}</p> : null}
                  <span className="mt-4 inline-block text-sm font-semibold text-[var(--lf-purple)]">Read article →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

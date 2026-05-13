"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { CraftCareBreadcrumb } from "@/components/craft-care/craft-care-breadcrumb";
import { craftCareOlive } from "@/lib/craft-care";
import { faqItems } from "@/lib/faqs";
import { site, whatsappHref } from "@/lib/site";

function IconChat({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-4.5A7.7 7.7 0 0 1 5 12a8 8 0 0 1 8-8h6a6 6 0 0 1 2 11.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FaqsView() {
  const [open, setOpen] = useState<Set<string>>(() => new Set(["contact"]));

  const toggle = useCallback((id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const waFloat = whatsappHref(`Hello ${site.name}, I have a question after reading your FAQs.`);

  return (
    <main className="bg-white pb-24">
      <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 lg:py-12">
        <CraftCareBreadcrumb items={[{ label: "Home", href: "/" }, { label: "FAQs" }]} />

        <h1 className="mt-8 font-sans text-4xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-5xl">FAQs</h1>

        <div className="mt-10 divide-y divide-zinc-200 border-t border-zinc-200">
          {faqItems.map((item) => {
            const isOpen = open.has(item.id);
            const paragraphs = item.answer.split(/\n\n+/).filter(Boolean);
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-start justify-between gap-4 py-5 text-left transition"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`text-[15px] font-semibold sm:text-base ${isOpen ? "" : "text-[var(--lf-ink)]"}`}
                    style={isOpen ? { color: craftCareOlive } : undefined}
                  >
                    {item.question}
                  </span>
                  <span
                    className="shrink-0 pt-0.5 text-lg font-light leading-none"
                    style={{ color: isOpen ? craftCareOlive : "var(--lf-muted)" }}
                    aria-hidden
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen ? (
                  <div className="space-y-4 pb-6 pr-2 sm:pr-8">
                    {paragraphs.map((p, idx) => (
                      <p key={idx} className="text-sm leading-relaxed text-[var(--lf-ink)] sm:text-[15px]">
                        {p}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-[var(--lf-muted)]">
          Still stuck?{" "}
          <Link href="/contact" className="font-semibold text-[var(--lf-purple-deep)] underline-offset-2 hover:underline">
            Contact us
          </Link>{" "}
          or WhatsApp the studio.
        </p>
      </div>

      <a
        href={waFloat}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-40 flex h-14 w-14 items-center justify-center rounded-sm text-white shadow-lg transition hover:opacity-90 sm:bottom-[max(2rem,env(safe-area-inset-bottom))] sm:right-[max(2rem,env(safe-area-inset-right))]"
        style={{ backgroundColor: craftCareOlive }}
        aria-label="Open WhatsApp chat"
      >
        <IconChat className="text-white" />
      </a>
    </main>
  );
}

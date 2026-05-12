import Link from "next/link";
import { CraftCareBreadcrumb } from "@/components/craft-care/craft-care-breadcrumb";
import { site, whatsappHref } from "@/lib/site";

function IconSpark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.9 5.7 21l2.3-7-6-4.6h7.6L12 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFlag({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 3v18M5 5h11l-2 4 2 4H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPalette({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21a9 9 0 0 0 9-9h-9V3a9 9 0 0 0 0 18Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="11" r="1.2" fill="currentColor" />
      <circle cx="10" cy="8" r="1.2" fill="currentColor" />
      <circle cx="14" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

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

function IconEnvelope({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4V6Zm8 6 8-5H4l8 5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBag({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12l1 12H5l1-12Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const body = "text-sm leading-relaxed text-[var(--lf-ink)] sm:text-[15px]";

export function AboutPageView() {
  const waAbout = whatsappHref(
    `Hello ${site.name}, I would love to learn more about your studio and modest fashion after reading your About page.`,
  );

  return (
    <main className="bg-white pb-24">
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:max-w-[960px] lg:py-12">
        <CraftCareBreadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />

        <h1 className="mt-8 font-serif text-4xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-5xl">
          About {site.name}
        </h1>

        <div className="mt-10 bg-zinc-100 px-6 py-10 text-center sm:px-10 sm:py-12">
          <p className="font-serif text-lg italic text-[var(--lf-ink)] sm:text-xl">“{site.slogan}”</p>
          <p className={`mt-6 ${body} text-[var(--lf-muted)]`}>
            {site.name} is a modest fashion studio in {site.location.line}. We blend careful tailoring with contemporary
            silhouettes—whether you are dressing for everyday, celebrations, or the office.
          </p>
          <p className={`mt-4 ${body}`}>
            Read our vision and mission below, then reach out on WhatsApp, through the contact form, or by browsing the
            shop when you are ready to explore pieces and lead times.
          </p>
        </div>

        <section className="mt-14">
          <div className="flex items-center gap-2 text-[var(--lf-ink)]">
            <IconSpark className="shrink-0 text-[var(--lf-purple-deep)]" />
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Our vision</h2>
          </div>
          <p className={`mt-2 text-sm font-semibold text-[var(--lf-ink)]`}>Where we are headed</p>
          <p className={`mt-8 ${body} text-[var(--lf-muted)]`}>{site.vision}</p>
        </section>

        <section className="mt-14">
          <div className="flex items-center gap-2 text-[var(--lf-ink)]">
            <IconFlag className="shrink-0 text-[var(--lf-purple-deep)]" />
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Our mission</h2>
          </div>
          <p className={`mt-2 text-sm font-semibold text-[var(--lf-ink)]`}>How we show up every day</p>
          <div className="mt-8 space-y-5">
            {site.mission.map((paragraph, i) => (
              <p key={i} className={`${body} text-[var(--lf-muted)]`}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="flex items-center gap-2 text-[var(--lf-ink)]">
            <IconPalette className="shrink-0 text-[var(--lf-purple-deep)]" />
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">What we make</h2>
          </div>
          <p className={`mt-2 text-sm font-semibold text-[var(--lf-ink)]`}>Specialties</p>
          <div className="mt-8 bg-zinc-100 px-6 py-10 text-center sm:px-10 sm:py-12">
            <p className={`${body} text-[var(--lf-muted)]`}>{site.specialties.join(" · ")}.</p>
          </div>
        </section>

        <ul className="mt-16 grid gap-4 sm:grid-cols-3 sm:gap-5">
          <li className="border border-[var(--lf-line)] bg-zinc-100 px-5 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-[var(--lf-ink)]">
              <IconChat />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-[var(--lf-ink)]">Chat with us</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--lf-muted)]">Questions about the studio or how we work? We reply fastest on WhatsApp.</p>
            <a
              href={waAbout}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center border border-[var(--lf-ink)] bg-white py-2.5 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
            >
              Start chat
            </a>
          </li>
          <li className="border border-[var(--lf-line)] bg-zinc-100 px-5 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-[var(--lf-ink)]">
              <IconEnvelope />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-[var(--lf-ink)]">Write to us</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--lf-muted)]">Use the same contact form as our Contact page—subject lines and studio email.</p>
            <Link
              href="/contact"
              className="mt-6 inline-flex w-full items-center justify-center border border-[var(--lf-ink)] bg-white py-2.5 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
            >
              Open contact form
            </Link>
          </li>
          <li className="border border-[var(--lf-line)] bg-zinc-100 px-5 py-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-[var(--lf-ink)]">
              <IconBag />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-[var(--lf-ink)]">Explore the shop</h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--lf-muted)]">See ready-to-wear and sample pieces—availability is confirmed on WhatsApp.</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex w-full items-center justify-center border border-[var(--lf-ink)] bg-white py-2.5 text-xs font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)]"
            >
              Browse shop
            </Link>
          </li>
        </ul>
      </div>

      <a
        href={whatsappHref(`Hello ${site.name}, I have a quick question from your website.`)}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-sm bg-[var(--lf-purple-deep)] text-white shadow-lg transition hover:bg-[var(--lf-purple)] sm:bottom-8 sm:right-8"
        aria-label="Open WhatsApp chat"
      >
        <IconChat className="text-white" />
      </a>
    </main>
  );
}

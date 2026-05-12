import Image from "next/image";
import Link from "next/link";
import { TopoPattern } from "@/components/topo-pattern";
import { site, whatsappHref } from "@/lib/site";

export default function HomePage() {
  const wa = whatsappHref(
    `Hello ${site.name}, I am on your website and would love to book a consultation in ${site.location.city}.`,
  );

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--lf-line)]">
        <TopoPattern className="pointer-events-none absolute inset-0 h-full w-full text-zinc-900" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="section-title">Osogbo · Nigeria · NGN</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-5xl">
              Modesty redefined.
              <span className="text-[var(--lf-purple)]"> Style redesigned.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--lf-muted)]">
              Bespoke couture, curated ready-to-wear, and custom designs for weddings,
              aso-ebi, church, office, and every chapter in between—crafted with care in{" "}
              {site.location.city}, {site.location.state}.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/shop" className="btn-primary inline-flex w-full sm:w-auto">
                View collections
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary inline-flex w-full sm:w-auto"
              >
                WhatsApp the studio
              </a>
            </div>
            <p className="mt-6 text-sm text-zinc-500">
              Prefer email?{" "}
              <a
                className="font-medium text-[var(--lf-purple)] hover:underline"
                href={`mailto:${site.contact.email}`}
              >
                {site.contact.email}
              </a>
            </p>
          </div>
          <div className="relative flex justify-center">
            <div className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-10 shadow-lg sm:p-14">
              <Image
                src={site.logo}
                alt={`${site.name} logo`}
                width={560}
                height={360}
                className="mx-auto h-auto w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="section-title">What we make</p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--lf-ink)] sm:text-3xl">
          From ballroom to boardroom
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {site.specialties.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-[var(--lf-line)] bg-[var(--lf-purple-faint)] px-4 py-3 text-sm font-medium text-zinc-800"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-[var(--lf-line)] bg-[var(--lf-purple-faint)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="section-title">How we work with you</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {site.offerings.map((o) => (
              <article
                key={o.title}
                className="rounded-2xl border border-[var(--lf-line)] bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[var(--lf-purple)]">{o.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--lf-muted)]">
                  {o.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="section-title">Training & apprentices</p>
            <h2 className="mt-3 text-2xl font-semibold">Grow inside the studio</h2>
            <p className="mt-4 text-[var(--lf-muted)]">
              In-person programmes run in Osogbo. Online training will be announced when
              ready. Apprentices get structured milestones, feedback, and visibility on
              their craft journey.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/training" className="btn-primary inline-flex justify-center">
                Training intake
              </Link>
              <Link href="/apprentice" className="btn-secondary inline-flex justify-center">
                Apprentice hub
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--lf-line)] bg-white p-8 shadow-sm">
            <p className="text-sm font-medium text-zinc-800">Studio location</p>
            <p className="mt-2 text-lg font-semibold text-[var(--lf-ink)]">{site.location.line}</p>
            <p className="mt-4 text-sm text-[var(--lf-muted)]">
              Book fittings and pickups through the site—your details travel with you to
              WhatsApp or email so every conversation starts with context.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

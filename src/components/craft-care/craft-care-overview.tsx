import Link from "next/link";
import { CraftCareBreadcrumb } from "@/components/craft-care/craft-care-breadcrumb";
import { craftCare, craftCareOlive } from "@/lib/craft-care";
import { site } from "@/lib/site";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";

export function CraftCareOverview() {
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:py-10">
        <CraftCareBreadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Craft & care", href: "/craft-care" }, { label: "All pages" }]}
        />
      </div>

      <section className="relative min-h-[min(52vh,28rem)] w-full">
        <LfRemoteImage
          src={craftCare.hubHero.image}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/15" aria-hidden />
        <div className="relative z-10 mx-auto flex min-h-[min(52vh,28rem)] max-w-[1400px] items-center justify-center px-4 py-20 sm:px-6">
          <p className="max-w-3xl text-center font-serif text-3xl font-medium leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {craftCare.hubHero.line}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl md:text-[2.75rem]">
          {craftCare.hubTitle}
        </h1>

        <div className="mt-14 grid gap-10 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-14 lg:gap-x-16 lg:gap-y-16">
          {craftCare.principles.map((p) => (
            <div key={p.title}>
              <h2 className="text-base font-semibold text-[var(--lf-ink)] sm:text-lg">{p.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--lf-muted)] sm:text-[15px]">
                {p.body.split(/\n\n+/).map((para, i) => (
                  <p key={`${p.title}-${i}`}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-20 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5">
          {craftCare.categoryTiles.map((tile) => (
            <li key={tile.label}>
              <Link href={tile.href} className="group/tile block">
                <div className="relative aspect-square overflow-hidden bg-zinc-100">
                  <LfRemoteImage
                    src={tile.image}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover/tile:scale-105"
                    sizes="(max-width: 640px) 50vw, 35vw"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white sm:text-sm"
                    style={{ backgroundColor: craftCareOlive }}
                  >
                    {tile.label}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-24 border-t border-[var(--lf-line)] pt-20" id="people">
          <h2 className="text-center font-serif text-2xl font-semibold text-[var(--lf-ink)] sm:text-3xl">
            People beyond us
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-[var(--lf-muted)]">
            Cutters, machinists, and finishing hands in Osogbo bring {site.name} pieces to life. We grow the bench
            through apprenticeships and paid training blocks—meet the studio on a visit or call.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {craftCare.peopleCollage.map((src) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden bg-zinc-200">
                <LfRemoteImage
                  src={src}
                  alt=""
                  fill
                  className="object-cover grayscale transition duration-500 hover:grayscale-0"
                  sizes="(max-width:640px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <Link
              href="/contact"
              className="inline-flex min-w-[12rem] items-center justify-center bg-[var(--lf-purple-deep)] px-10 py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--lf-purple)]"
            >
              Meet our team
            </Link>
          </div>
        </section>

        <section className="mt-24 scroll-mt-28 border-t border-[var(--lf-line)] pt-16" id="packaging">
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">{craftCare.packaging.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--lf-muted)] sm:text-base">{craftCare.packaging.body}</p>
        </section>

        <section className="mt-16 scroll-mt-28 pb-8" id="product-care">
          <h2 className="font-serif text-2xl font-semibold text-[var(--lf-ink)]">{craftCare.productCare.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--lf-muted)] sm:text-base">{craftCare.productCare.body}</p>
        </section>
      </div>
    </main>
  );
}

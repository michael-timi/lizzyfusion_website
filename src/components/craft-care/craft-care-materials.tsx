import Link from "next/link";
import { CraftCareBreadcrumb } from "@/components/craft-care/craft-care-breadcrumb";
import { craftCare } from "@/lib/craft-care";
import { LfRemoteImage } from "@/components/ui/lf-remote-image";

export function CraftCareMaterials() {
  const { title, intro, closing, rows } = craftCare.materialsPage;

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:max-w-[960px] lg:py-12">
        <CraftCareBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Craft & care", href: "/craft-care" },
            { label: "Materials" },
          ]}
        />

        <h1 className="mt-8 font-sans text-3xl font-semibold tracking-tight text-[var(--lf-ink)] sm:text-4xl">{title}</h1>
        <p className="mt-6 text-sm leading-relaxed text-[var(--lf-muted)] sm:text-base">{intro}</p>

        <div className="mt-16 space-y-20 lg:space-y-24">
          {rows.map((row, index) => {
            const imageFirst = index % 2 === 0;
            const media = (
              <div className="relative min-h-[14rem] flex-1 overflow-hidden bg-zinc-100 sm:min-h-[18rem] lg:min-h-[22rem]">
                <LfRemoteImage
                  src={row.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
              </div>
            );
            const copy = (
              <div className="flex flex-1 flex-col justify-center py-2 lg:py-6">
                <h2 className="text-xl font-semibold text-[var(--lf-ink)] sm:text-2xl">{row.name}</h2>
                <p className="mt-4 text-sm leading-relaxed text-[var(--lf-muted)] sm:text-[15px]">{row.body}</p>
              </div>
            );
            return (
              <article
                key={row.name}
                className={`flex flex-col gap-8 border-t border-[var(--lf-line)] pt-12 first:border-t-0 first:pt-0 lg:flex-row lg:items-stretch lg:gap-12 lg:pt-16 first:lg:pt-0 ${
                  imageFirst ? "" : "lg:flex-row-reverse"
                }`}
              >
                {media}
                {copy}
              </article>
            );
          })}
        </div>

        <div className="mt-20 space-y-5 border-t border-[var(--lf-line)] pt-12 text-sm leading-relaxed text-[var(--lf-muted)] sm:text-base">
          {closing.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p>
            <Link href="/contact" className="font-semibold text-[var(--lf-purple-deep)] underline-offset-2 hover:underline">
              Contact the studio
            </Link>{" "}
            for our latest fibre and sourcing notes, or mention materials when you message on WhatsApp.
          </p>
        </div>

        <p className="mt-10 text-sm text-[var(--lf-muted)]">
          <Link href="/craft-care" className="font-medium text-[var(--lf-ink)] underline-offset-2 hover:text-[var(--lf-purple-deep)] hover:underline">
            ← Back to Craft & care
          </Link>
        </p>
      </div>
    </main>
  );
}

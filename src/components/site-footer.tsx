import Link from "next/link";
import { nav, site, whatsappHref } from "@/lib/site";

export function SiteFooter() {
  const quickHi = whatsappHref(
    `Hello ${site.name}, I found you on your website and I would like to enquire about your services.`,
  );

  return (
    <footer className="mt-auto bg-[#1a1a1a] text-zinc-300">
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-2xl font-semibold tracking-tight text-white">
              Join the {site.name} list
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
              New drops, aso-ebi slots, and Osogbo studio dates—tell us on WhatsApp or email
              and we will note your preferences.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={quickHi}
                target="_blank"
                rel="noreferrer"
                className="inline-flex border border-white bg-white px-6 py-3 text-sm font-semibold text-[#1a1a1a] transition hover:bg-zinc-200"
              >
                WhatsApp updates
              </a>
              <Link
                href="/contact"
                className="inline-flex border border-zinc-600 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
              >
                Email the studio
              </Link>
            </div>
            <div className="mt-8 flex gap-4 text-zinc-500">
              <span className="text-xs uppercase tracking-wider">Social</span>
              <a href={quickHi} className="text-xs text-white hover:underline" target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <a href={`mailto:${site.contact.email}`} className="text-xs text-white hover:underline">
                Email
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">About</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white">
                  Our story
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  Vision & mission
                </Link>
              </li>
              <li>
                <Link href="/training" className="hover:text-white">
                  Training
                </Link>
              </li>
              <li>
                <Link href="/apprentice" className="hover:text-white">
                  Apprentices
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Shop</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/shop" className="hover:text-white">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/lookbook" className="hover:text-white">
                  Lookbook
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white">
                  Wish list
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/custom" className="hover:text-white">
                  Custom & bespoke
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Book a fitting
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Help</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/faqs" className="hover:text-white">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <a href={quickHi} className="hover:text-white" target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </li>
              <li>
                <span className="text-zinc-500">{site.contact.phoneDisplay}</span>
              </li>
              <li>
                <span className="text-zinc-500">{site.location.line}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. {site.slogan}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {nav.slice(0, 4).map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

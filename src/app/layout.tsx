import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { publicSiteUrl, site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

/** Only weights used with `font-serif` in the UI (400 inherited, 500/600 explicit). Fewer files = faster dev compile. */
const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl()),
  /** Explicit `/public/icon.png` — not `app/icon.*` — so the tab icon is always Lizzy Fusion's mark. */
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "285x281" }],
    apple: [{ url: "/icon.png", type: "image/png", sizes: "285x281" }],
    shortcut: "/icon.png",
  },
  title: {
    default: `${site.name} — ${site.slogan}`,
    template: `%s — ${site.name}`,
  },
  description: `${site.name} in ${site.location.line}. Bespoke, ready-to-wear, and custom modest fashion in Naira. ${site.slogan}`,
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
  openGraph: {
    title: site.name,
    description: site.slogan,
    locale: "en_NG",
    type: "website",
    url: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${serif.variable} h-full scroll-smooth antialiased`}
    >
      {/* suppressHydrationWarning: extensions (e.g. Grammarly) inject attributes on <body> */}
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-white text-[var(--lf-ink)]"
      >
        <Providers>
          <a
            href="#main-content"
            className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-md bg-white px-4 py-3 text-sm font-semibold text-[var(--lf-ink)] shadow-lg opacity-0 pointer-events-none transition focus:translate-y-0 focus:opacity-100 focus:pointer-events-auto focus:outline-none focus:ring-2 focus:ring-[var(--lf-purple)]"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <div id="main-content" tabIndex={-1} className="flex-1 min-w-0 outline-none">
            {children}
          </div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

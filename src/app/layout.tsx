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
  title: {
    default: `${site.name} — ${site.slogan}`,
    template: `%s — ${site.name}`,
  },
  description: `${site.name} in ${site.location.line}. Bespoke, ready-to-wear, and custom modest fashion in Naira. ${site.slogan}`,
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
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

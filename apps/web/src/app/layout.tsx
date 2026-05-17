import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Zavestni Dogodki — Zavestni dogodki v Sloveniji", template: "%s | Zavestni Dogodki" },
  description: "Kurirani imenik zavestnih dogodkov v Sloveniji — joga, meditacija, dihalne vaje, zvočne kopeli, retreati in duhovne prireditve.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"),
  keywords: ["zavestni dogodki", "joga slovenija", "meditacija", "breathwork", "zvočna kopel", "retreat slovenija", "kakao ceremonija", "duhovnost"],
  openGraph: { siteName: "Zavestni Dogodki", locale: "sl_SI", type: "website" },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.json",
  other: {
    "google-site-verification": process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "8L_aWJaREtd1Vti4JW2CNkjEUyUXHm5w6f7TydzEe0s",
    "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION ?? "",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Zavestni Dogodki",
  url: "https://zavestnidogodki.si",
  logo: {
    "@type": "ImageObject",
    url: "https://zavestnidogodki.si/icon-512.png",
    width: 512,
    height: 512,
  },
  sameAs: [
    "https://www.facebook.com/groups/529182865647567",
  ],
  description: "Kurirani imenik zavestnih dogodkov v Sloveniji — joga, meditacija, dihalne vaje, zvočne kopeli in retreati.",
  areaServed: { "@type": "Country", name: "Slovenia", sameAs: "https://www.wikidata.org/wiki/Q215" },
  knowsAbout: ["joga", "meditacija", "breathwork", "zvočne kopeli", "retreati", "wellness"],
  inLanguage: "sl",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Zavestni Dogodki",
  url: "https://zavestnidogodki.si",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://zavestnidogodki.si/events?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${geist.className} bg-stone-50 text-stone-900 antialiased min-h-full flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive" dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`,
            }} />
          </>
        )}
      </body>
    </html>
  );
}

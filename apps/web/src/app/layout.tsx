import type { Metadata } from "next";
import { Geist } from "next/font/google";
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
    "google-site-verification": "",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className="h-full">
      <body className={`${geist.className} bg-stone-50 text-stone-900 antialiased min-h-full flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}

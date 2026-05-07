import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Zavestni Dogodki", template: "%s | Zavestni Dogodki" },
  description: "Vaš vodič po zavestnih dogodkih v Sloveniji — joga, meditacija, dihanje, zvočne kopeli in duhovne prireditve.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"),
  openGraph: { siteName: "Zavestni Dogodki", locale: "sl_SI", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sl" className="h-full">
      <body className={`${geist.className} bg-stone-50 text-stone-900 antialiased min-h-full flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

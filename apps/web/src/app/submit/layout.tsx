import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Dodaj Zavestni Dogodek v Slovenijo — Brezplačna Objava | Zavestni Dogodki" },
  description: "Brezplačno objavite joga delavnico, meditacijo, breathwork ali retreat v Sloveniji. Dosezite tisoče zavestnih iskalcev. Vaš dogodek bo objavljen v 24 urah.",
  keywords: ["objavi dogodek", "dodaj joga delavnico", "facilitator slovenija", "zavestni dogodki objava", "yoga studio objava"],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"}/submit`,
  },
  openGraph: {
    title: "Dodaj Zavestni Dogodek — Brezplačna Objava | Zavestni Dogodki",
    description: "Brezplačno objavite joga delavnico, meditacijo, breathwork ali retreat v Sloveniji. Dosezite tisoče zavestnih iskalcev.",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"}/submit`,
    type: "website",
    locale: "sl_SI",
    siteName: "Zavestni Dogodki",
  },
};

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

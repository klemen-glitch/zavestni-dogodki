import type { Metadata } from "next";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

export const metadata: Metadata = {
  title: { absolute: "Conscious Pass — Popusti na Jogo & Retreate v Sloveniji | Zavestni Dogodki" },
  description: "Conscious Pass: do 30 % popust na joga delavnice, meditacijo in retreate po vsej Sloveniji. Prednostni dostop do novih dogodkov in tedenski kurirani digest.",
  keywords: ["conscious pass", "popust joga slovenija", "wellness naročnina", "zavestni dogodki pass", "retreat popust"],
  alternates: {
    canonical: `${appUrl}/pass`,
  },
  openGraph: {
    title: "Conscious Pass — Popusti na Jogo & Retreate v Sloveniji",
    description: "Do 30 % popust na joga delavnice, meditacijo in retreate po vsej Sloveniji z Conscious Pass naročnino.",
    url: `${appUrl}/pass`,
    type: "website",
    locale: "sl_SI",
    siteName: "Zavestni Dogodki",
  },
};

const BENEFITS = [
  { emoji: "💸", title: "Do 30% popust", desc: "Ekskluzivne kode za popuste pri partnerskih studiih in facilitatorjih." },
  { emoji: "⭐", title: "Prednostni dostop", desc: "Zgodnje obvestilo o prihajajoči retroevents in retreatih." },
  { emoji: "📧", title: "Tedenski digest", desc: "Kurirani seznam najboljših dogodkov direktno v vaš predal." },
  { emoji: "🤝", title: "Skupnost", desc: "Dostop do ekskluzivnega chanela za naše naročnike." },
  { emoji: "🗺️", title: "Interaktivni zemljevid", desc: "Filtrirajte dogodke po lokaciji, kategoriji in ceni." },
  { emoji: "📅", title: "Osebni koledar", desc: "Sinhronizacija z vašim Google ali Apple koledarjem." },
];

export default function PassPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
          🎫 Kmalu na voljo
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
          Conscious Pass
        </h1>
        <p className="text-xl text-stone-500 max-w-xl mx-auto mb-8">
          En pass za dostop do vseh zavestnih dogodkov v Sloveniji z ekskluzivnimi popusti in prednostnim dostopom.
        </p>
        <div className="inline-flex items-center gap-3 bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold">
          <span>🌿</span>
          <span>Kmalu na voljo · Prijavite se za obvestilo</span>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {BENEFITS.map((b) => (
          <div key={b.title} className="bg-white rounded-2xl border border-stone-100 p-6">
            <div className="text-3xl mb-3">{b.emoji}</div>
            <h3 className="font-semibold text-stone-800 mb-1">{b.title}</h3>
            <p className="text-stone-500 text-sm">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing teaser */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-800 rounded-3xl p-10 text-center text-white mb-16">
        <h2 className="text-2xl font-bold mb-2">Cena ob lansiranju</h2>
        <div className="flex items-end justify-center gap-1 mb-4">
          <span className="text-6xl font-bold">9</span>
          <span className="text-2xl mb-2">€/mes</span>
        </div>
        <p className="text-emerald-300 mb-6">ali 79 € letno — prihranite 2 meseca</p>
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-sm text-emerald-200">🎁 Prvi 100 naročnikov dobi doživljenjski early-bird popust</p>
        </div>
      </div>

      {/* Newsletter signup for early access */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-800 text-center mb-4">
          Bodite prvi obveščeni
        </h2>
        <p className="text-stone-500 text-center mb-8">Prijavite se na newsletter in prejmite obvestilo ko bo Conscious Pass na voljo.</p>
        <NewsletterSignup />
      </div>

      {/* For organizers */}
      <div className="bg-stone-100 rounded-2xl p-8 text-center">
        <h3 className="text-lg font-semibold text-stone-800 mb-2">Ste facilitator ali studio?</h3>
        <p className="text-stone-500 text-sm mb-4">Postanite partner in dosezite naše naročnike z ekskluzivnimi ponudbami.</p>
        <a href="mailto:partner@zavestnidogodki.si" className="text-emerald-700 font-medium hover:underline">
          Pišite nam →
        </a>
      </div>
    </div>
  );
}

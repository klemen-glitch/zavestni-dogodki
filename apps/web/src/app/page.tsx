export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { SubscribeSection } from "@/components/subscribe/SubscribeSection";
import { CATEGORY_EMOJI, CATEGORY_LABEL, ALL_CATEGORIES } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Zavestni Dogodki — Joga, Meditacija & Retreati v Sloveniji 2026" },
  description: "Kurirani imenik zavestnih dogodkov v Sloveniji. Najdi joga delavnice, meditacijske tečaje, breathwork, zvočne kopeli in retreate v tvojem mestu. Brezplačna objava.",
  keywords: ["zavestni dogodki", "joga slovenija", "meditacija slovenija", "breathwork", "retreat slovenija", "zvočna kopel", "mindfulness", "wellness eventi"],
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si",
    languages: {
      sl: process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si",
      "x-default": process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si",
    },
  },
  openGraph: {
    title: "Zavestni Dogodki — Joga, Meditacija & Retreati v Sloveniji",
    description: "Kurirani imenik zavestnih dogodkov v Sloveniji — joga, meditacija, breathwork, zvočne kopeli in retreati. Brezplačna objava.",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si",
    type: "website",
    locale: "sl_SI",
    siteName: "Zavestni Dogodki",
  },
};

const CITIES = [
  { name: "Ljubljana",  emoji: "🏙️" },
  { name: "Maribor",    emoji: "🌆" },
  { name: "Bled",       emoji: "🏔️" },
  { name: "Koper",      emoji: "⛵" },
  { name: "Celje",      emoji: "🌿" },
  { name: "Bohinj",     emoji: "💧" },
];

async function getHomeData() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [featured, upcoming, thisWeek, categoryCounts, totalStats] = await Promise.all([
    db.event.findMany({
      where: { status: "FEATURED", date: { gte: now } },
      orderBy: { date: "asc" },
      take: 3,
      include: { organizer: true, venue: true },
    }),
    db.event.findMany({
      where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: now } },
      orderBy: [{ featured: "desc" }, { date: "asc" }],
      take: 9,
      include: { organizer: true, venue: true },
    }),
    db.event.findMany({
      where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: now, lte: in7Days } },
      orderBy: { date: "asc" },
      take: 4,
      include: { organizer: true, venue: true },
    }),
    db.event.groupBy({
      by: ["category"],
      where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: now } },
      _count: { _all: true },
    }),
    db.event.count({
      where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: now } },
    }),
  ]);

  const categoryCountMap = Object.fromEntries(
    categoryCounts.map((c) => [c.category, c._count._all])
  );

  return { featured, upcoming, thisWeek, categoryCountMap, totalStats };
}

export default async function HomePage() {
  const { featured, upcoming, thisWeek, categoryCountMap, totalStats } = await getHomeData();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Kaj so zavestni dogodki?", acceptedAnswer: { "@type": "Answer", text: "Zavestni dogodki so prireditve, ki spodbujajo osebnostno rast, dobro počutje in duhovno zavedanje — joga delavnice, meditacijski tečaji, breathwork (dihalne vaje), zvočne kopeli, kakao ceremonije in yoga retreati. Zavestni Dogodki je kurirani imenik tovrstnih prireditev po vsej Sloveniji." } },
      { "@type": "Question", name: "Kje najdem joga delavnice in meditacijo v Sloveniji?", acceptedAnswer: { "@type": "Answer", text: "Zavestni Dogodki zbira vse joga delavnice, meditacijske tečaje, breathwork seje, zvočne kopeli in retreate v Sloveniji na enem mestu. Filtrirate lahko po mestu (Ljubljana, Maribor, Koper, Bled), kategoriji in datumu." } },
      { "@type": "Question", name: "Koliko stane breathwork delavnica ali zvočna kopel?", acceptedAnswer: { "@type": "Answer", text: "Skupinske breathwork delavnice in zvočne kopeli v Sloveniji stanejo med 15 in 35 EUR za 60–90-minutno sejo. Yoga retreati (vikend all-inclusive) so od 150 do 400 EUR. Kakao ceremonije so tipično 20–40 EUR." } },
      { "@type": "Question", name: "Kaj je yoga retreat in kako ga izbrati?", acceptedAnswer: { "@type": "Answer", text: "Yoga retreat je večdnevni odmik z intenzivno joga prakso, meditacijo, zdravo hrano in naravnim okoljem. Slovenija nudi odlične lokacije — Bled, Bohinj, Julijske Alpe in jadransko obalo." } },
      { "@type": "Question", name: "Kako objavim zavestni dogodek na Zavestni Dogodki?", acceptedAnswer: { "@type": "Answer", text: "Objavo oddate prek obrazca na /submit. V času otvoritve je objava brezplačna za vse facilitatorje. Vaš dogodek bo pregledan in objavljen v roku 24 ur." } },
      { "@type": "Question", name: "Ali je zvočna kopel primerna za začetnike?", acceptedAnswer: { "@type": "Answer", text: "Da — zvočna kopel je primerna za začetnike. Ne zahteva predznanja, fizične pripravljenosti ali meditacijske izkušnje. Udeleženci preprosto ležijo, medtem ko vodja igra Tibetanske posode, gong in kristalne posode." } },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Zavestni Dogodki v Sloveniji",
    description: "Kurirani imenik zavestnih dogodkov v Sloveniji — joga, meditacija, breathwork, zvočne kopeli in retreati.",
    url: appUrl,
    inLanguage: "sl",
    publisher: { "@type": "Organization", name: "Zavestni Dogodki", url: appUrl },
    speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "h2", ".speakable"] },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 to-stone-950 text-white">
        {/* subtle botanical texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #4ade80 0%, transparent 50%), radial-gradient(circle at 80% 20%, #34d399 0%, transparent 40%)" }} />

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16">
          {/* launch banner */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-700/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-300">
              🎉 Objava otvoritev — dodajte vaš dogodek{" "}
              <span className="line-through text-emerald-500/70">15 €</span>{" "}
              <span className="text-white font-bold">BREZPLAČNO</span>
              <Link href="/submit" className="ml-1 text-emerald-300 hover:text-white underline">→</Link>
            </span>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-5">
              Zavestni dogodki<br />
              <span className="text-emerald-400">v Sloveniji</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-300 max-w-xl mx-auto mb-8 leading-relaxed">
              Kurirani imenik joge, meditacije, dihalnih vaj,<br className="hidden md:block" />
              zvočnih kopeli in zavestnih prireditev.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link href="/events"
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-8 py-3.5 rounded-full text-base font-bold transition-colors shadow-lg shadow-emerald-500/20">
                Poišči dogodek
              </Link>
              <Link href="/submit"
                className="border border-stone-500 hover:border-emerald-500 text-stone-300 hover:text-white px-8 py-3.5 rounded-full text-base font-medium transition-colors">
                Dodaj svoj dogodek
              </Link>
            </div>

            {totalStats > 0 && (
              <p className="text-stone-400 text-sm mb-8">
                {totalStats} aktivnih dogodkov po vsej Sloveniji
              </p>
            )}

            {/* City quick-pick */}
            <div className="flex flex-wrap gap-2 justify-center">
              {CITIES.map((c) => (
                <Link key={c.name} href={`/events?city=${encodeURIComponent(c.name)}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 rounded-full text-xs font-medium text-stone-300 hover:text-white transition-all backdrop-blur-sm">
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-stone-50 to-transparent" />
      </section>

      <div className="max-w-6xl mx-auto px-4">

        {/* ── This week spotlight ─────────────────────────────────────────── */}
        {thisWeek.length > 0 && (
          <section className="mt-12 mb-16">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Ta teden
                </span>
                <h2 className="text-xl font-bold text-stone-800">Dogaja se kmalu</h2>
              </div>
              <Link href="/events?dateRange=week" className="text-emerald-700 text-sm hover:underline">
                Vsi ta teden →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {thisWeek.map((e) => (
                <Link key={e.id} href={`/events/${e.slug ?? e.id}`}
                  className="group bg-white border border-stone-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all">
                  {e.imageUrl ? (
                    <div className="relative h-32 overflow-hidden">
                      <Image src={e.imageUrl} alt={e.titleSl ?? e.titleEn} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ objectPosition: "50% 20%" }} />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-4xl">
                      {CATEGORY_EMOJI[e.category] ?? "🌸"}
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-bold text-emerald-700 mb-1">
                      {CATEGORY_EMOJI[e.category]} {e.date.toLocaleDateString("sl-SI", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Ljubljana" })}
                    </p>
                    <p className="text-sm font-semibold text-stone-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {e.titleSl ?? e.titleEn}
                    </p>
                    {(e.venue?.city ?? e.venueName) && (
                      <p className="text-xs text-stone-400 mt-1 truncate">
                        📍 {e.venue?.city ?? e.venueName?.split(",").pop()?.trim()}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured ────────────────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-800">⭐ Izpostavljeni dogodki</h2>
              <Link href="/events?featured=true" className="text-emerald-700 text-sm hover:underline">Vsi izpostavljeni →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((e) => <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />)}
            </div>
          </section>
        )}

        {/* ── Category grid with live counts ──────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-stone-800 mb-6">Kategorije</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_CATEGORIES.filter((c) => c !== "OTHER").map((cat) => {
              const count = categoryCountMap[cat] ?? 0;
              return (
                <Link key={cat} href={`/events?category=${cat}`}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-stone-100 hover:border-emerald-300 hover:shadow-md transition-all group relative">
                  <span className="text-3xl">{CATEGORY_EMOJI[cat]}</span>
                  <span className="text-xs font-semibold text-stone-700 text-center group-hover:text-emerald-700">
                    {CATEGORY_LABEL[cat]}
                  </span>
                  {count > 0 && (
                    <span className="absolute top-2 right-2 bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {count}
                    </span>
                  )}
                  {count === 0 && (
                    <span className="text-xs text-stone-300">Kmalu</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Upcoming events ─────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">Prihajajoči dogodki</h2>
            <Link href="/events" className="text-emerald-700 text-sm hover:underline">Vsi dogodki →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <p className="text-5xl mb-4">🌱</p>
              <p>Kmalu bodo dodani novi dogodki.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((e) => <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />)}
            </div>
          )}
        </section>

        {/* ── Quick-access strip ──────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="rounded-2xl overflow-hidden border border-stone-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
              {[
                { emoji: "📍", title: "Najdi evento blizu tebe", desc: "Filtriraj po mestu ali regiji", href: "/events", cta: "Išči po lokaciji" },
                { emoji: "📅", title: "Ta vikend v naravi", desc: "Retreati, joga in meditacija v naravnem okolju", href: "/events?dateRange=weekend&category=RETREAT", cta: "Vikend retreati" },
                { emoji: "🎁", title: "Brezplačni dogodki", desc: "Odprti krogi, uvodni tečaji in več", href: "/events?free=true", cta: "Brezplačno" },
              ].map((item) => (
                <Link key={item.title} href={item.href} className="group flex items-start gap-4 p-5 bg-white hover:bg-emerald-50 transition-colors">
                  <span className="text-3xl">{item.emoji}</span>
                  <div>
                    <p className="font-semibold text-stone-800 text-sm group-hover:text-emerald-700 transition-colors">{item.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5 mb-2">{item.desc}</p>
                    <span className="text-xs font-bold text-emerald-700">{item.cta} →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-stone-800 mb-6 speakable">Pogosta vprašanja o zavestnih dogodkih</h2>
          <div className="space-y-3">
            {[
              { q: "Kaj so zavestni dogodki?", a: "Zavestni dogodki so prireditve, ki spodbujajo osebnostno rast, dobro počutje in duhovno zavedanje — joga delavnice, meditacijski tečaji, breathwork (dihalne vaje), zvočne kopeli, kakao ceremonije in yoga retreati. Zavestni Dogodki je kurirani imenik tovrstnih prireditev po vsej Sloveniji." },
              { q: "Kje najdem joga delavnice in meditacijo v Sloveniji?", a: "Zavestni Dogodki zbira vse joga delavnice, meditacijske tečaje, breathwork seje, zvočne kopeli in retreate v Sloveniji na enem mestu. Filtrirate lahko po mestu (Ljubljana, Maribor, Koper, Bled...), kategoriji in datumu. Večina prireditev je v Ljubljani in Mariboru, a pogosto najdemo tudi dogodke v naravi po vsej Sloveniji." },
              { q: "Koliko stane breathwork delavnica ali zvočna kopel?", a: "Skupinske breathwork delavnice in zvočne kopeli v Sloveniji stanejo med 15 in 35 EUR za 60–90-minutno sejo. Yoga retreati (vikend all-inclusive) so od 150 do 400 EUR. Kakao ceremonije so tipično 20–40 EUR. Pogosti so tudi brezplačni uvodni dogodki — filtrirajte po »brezplačno« na naši strani." },
              { q: "Kaj je yoga retreat in kako ga izbrati?", a: "Yoga retreat je večdnevni odmik z intenzivno joga prakso, meditacijo, zdravo hrano in naravnim okoljem. Slovenija nudi odlične lokacije — Bled, Bohinj, Julijske Alpe in jadransko obalo. Pri izbiri upoštevajte: raven zahtevnosti (začetniki vs. napredni), profil inštruktorja, velikost skupine (idealno do 12 udeležencev) in lokacijo." },
              { q: "Kako objavim zavestni dogodek na Zavestni Dogodki?", a: "Objavo oddate prek obrazca na strani /submit. V času otvoritve je objava brezplačna za vse facilitatorje. Vaš dogodek bo pregledan in objavljen v roku 24 ur. Na voljo sta dve možnosti: osnovna objava (30 dni vidljivost) in izpostavljena objava (60 dni + newsletter)." },
              { q: "Ali je zvočna kopel primerna za začetnike?", a: "Da — zvočna kopel je ena najprimernejših praks za začetnike. Ne zahteva predznanja, fizične pripravljenosti ali meditacijske izkušnje. Udeleženci preprosto ležijo, medtem ko vodja igra Tibetanske posode, gong in kristalne posode. Večina udeležencev poroča o globoki sprostitvi že po prvi seji." },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer font-semibold text-stone-800 hover:text-emerald-700 transition-colors list-none">
                  {q}
                  <span className="flex-shrink-0 text-stone-400 group-open:rotate-180 transition-transform text-xl leading-none">›</span>
                </summary>
                <p className="px-6 pb-5 text-stone-600 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-sm text-stone-400 text-center">
            Imate več vprašanj?{" "}
            <Link href="/blog" className="text-emerald-700 hover:underline">Preberite naš blog →</Link>
          </p>
        </section>

        {/* ── Newsletter ──────────────────────────────────────────────────── */}
        <section id="newsletter" className="mb-20 max-w-4xl mx-auto">
          <SubscribeSection source="home_section" />
        </section>

      </div>
    </>
  );
}

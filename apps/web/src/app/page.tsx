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

const CITIES = ["Ljubljana", "Maribor", "Bled", "Koper", "Celje", "Bohinj"];

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
      <section className="relative overflow-hidden bg-background">
        {/* subtle botanical circle decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] opacity-[0.04] pointer-events-none">
          <svg viewBox="0 0 600 600" fill="none">
            <circle cx="300" cy="300" r="280" stroke="#5a7a5e" strokeWidth="1"/>
            <circle cx="300" cy="300" r="200" stroke="#5a7a5e" strokeWidth="0.8"/>
            <circle cx="300" cy="300" r="120" stroke="#5a7a5e" strokeWidth="0.6"/>
            <path d="M300 20 C330 140 400 200 300 300 C200 400 260 460 300 580" stroke="#5a7a5e" strokeWidth="0.8"/>
            <path d="M20 300 C140 270 200 200 300 300 C400 400 460 340 580 300" stroke="#5a7a5e" strokeWidth="0.8"/>
          </svg>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-16">
          {/* launch banner */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 border border-brand/20 bg-brand-pale/50 px-5 py-1.5 rounded-full text-[11px] tracking-[0.18em] uppercase text-brand font-medium">
              Brezplačna objava za facilitatorje
              <Link href="/submit" className="hover:opacity-70 transition-opacity">→</Link>
            </span>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-serif text-5xl md:text-7xl font-light leading-[1.15] tracking-wide mb-6 text-stone-800">
              Zavestni dogodki<br />
              <span className="text-brand italic">v Sloveniji</span>
            </h1>
            <p className="text-base md:text-lg text-stone-500 max-w-xl mx-auto mb-10 leading-relaxed">
              Kurirani imenik joge, meditacije, dihalnih vaj,
              zvočnih kopeli in zavestnih prireditev.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <Link href="/events"
                className="bg-brand text-white px-8 py-3.5 rounded-full text-sm font-medium tracking-widest uppercase hover:opacity-90 transition-opacity">
                Poišči dogodek
              </Link>
              <Link href="/submit"
                className="border border-stone-300 text-stone-500 hover:border-brand hover:text-brand px-8 py-3.5 rounded-full text-sm font-medium tracking-widest uppercase transition-colors">
                Dodaj vaš dogodek
              </Link>
            </div>

            {totalStats > 0 && (
              <p className="text-stone-400 text-xs tracking-[0.18em] uppercase mb-8">
                {totalStats} aktivnih dogodkov po vsej Sloveniji
              </p>
            )}

            {/* City quick-pick */}
            <div className="flex flex-wrap gap-2 justify-center">
              {CITIES.map((city) => (
                <Link key={city} href={`/events?city=${encodeURIComponent(city)}`}
                  className="px-4 py-1.5 border border-stone-200 hover:border-brand/40 hover:text-brand rounded-full text-xs text-stone-400 transition-all tracking-wide">
                  {city}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">

        {/* ── This week spotlight ─────────────────────────────────────────── */}
        {thisWeek.length > 0 && (
          <section className="mt-14 mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <h2 className="text-xs tracking-[0.18em] uppercase text-stone-500 font-medium">Ta teden</h2>
              </div>
              <Link href="/events?dateRange=week" className="text-xs text-brand tracking-widest uppercase hover:underline">
                Vsi ta teden →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {thisWeek.map((e) => (
                <Link key={e.id} href={`/events/${e.slug ?? e.id}`}
                  className="group bg-white/70 border border-stone-100 rounded-xl overflow-hidden hover:shadow-sm hover:border-brand/20 transition-all">
                  {e.imageUrl ? (
                    <div className="relative h-32 overflow-hidden">
                      <Image src={e.imageUrl} alt={e.titleSl ?? e.titleEn} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ objectPosition: "50% 20%" }} />
                    </div>
                  ) : (
                    <div className="h-32 bg-brand-pale/50 flex items-center justify-center">
                      <span className="text-brand/20 font-serif text-3xl font-light">
                        {CATEGORY_LABEL[e.category] ?? "Dogodek"}
                      </span>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-[11px] tracking-[0.15em] uppercase text-brand mb-1">
                      {e.date.toLocaleDateString("sl-SI", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Ljubljana" })}
                    </p>
                    <p className="text-sm font-medium text-stone-800 line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                      {e.titleSl ?? e.titleEn}
                    </p>
                    {(e.venue?.city ?? e.venueName) && (
                      <p className="text-[11px] text-stone-400 mt-1 truncate">
                        {e.venue?.city ?? e.venueName?.split(",").pop()?.trim()}
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[11px] tracking-[0.2em] uppercase text-brand mb-1">Izpostavljeno</p>
                <h2 className="font-serif text-2xl font-light text-stone-800">Posebni dogodki</h2>
              </div>
              <Link href="/events?featured=true" className="text-xs text-brand tracking-widest uppercase hover:underline">Vsi →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((e) => <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />)}
            </div>
          </section>
        )}

        {/* ── Category grid with live counts ──────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8">
            <p className="text-[11px] tracking-[0.2em] uppercase text-brand mb-1">Razišči</p>
            <h2 className="font-serif text-2xl font-light text-stone-800">Kategorije prireditev</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ALL_CATEGORIES.filter((c) => c !== "OTHER").map((cat) => {
              const count = categoryCountMap[cat] ?? 0;
              return (
                <Link key={cat} href={`/events?category=${cat}`}
                  className="flex flex-col items-start gap-2 p-4 bg-white/60 rounded-xl border border-stone-100 hover:border-brand/30 hover:bg-brand-pale/20 transition-all group">
                  <span className="text-xl">{CATEGORY_EMOJI[cat]}</span>
                  <span className="text-xs font-medium text-stone-700 group-hover:text-brand transition-colors">
                    {CATEGORY_LABEL[cat]}
                  </span>
                  {count > 0 ? (
                    <span className="text-[10px] text-stone-400">{count} prihajajoče</span>
                  ) : (
                    <span className="text-[10px] text-stone-300">Kmalu</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Upcoming events ─────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-brand mb-1">Prihaja</p>
              <h2 className="font-serif text-2xl font-light text-stone-800">Prihajajoči dogodki</h2>
            </div>
            <Link href="/events" className="text-xs text-brand tracking-widest uppercase hover:underline">Vsi dogodki →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <p className="font-serif text-4xl font-light mb-4">∿</p>
              <p className="text-sm">Kmalu bodo dodani novi dogodki.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((e) => <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />)}
            </div>
          )}
        </section>

        {/* ── Quick-access strip ──────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="rounded-2xl overflow-hidden border border-stone-100 bg-white/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
              {[
                { title: "Po lokaciji", desc: "Filtriraj po mestu ali regiji", href: "/events", cta: "Išči po lokaciji" },
                { title: "Vikend retreati", desc: "Joga in meditacija v naravnem okolju", href: "/events?dateRange=weekend&category=RETREAT", cta: "Poišči retreat" },
                { title: "Brezplačni dogodki", desc: "Odprti krogi, uvodni tečaji in več", href: "/events?free=true", cta: "Brezplačno" },
              ].map((item) => (
                <Link key={item.title} href={item.href} className="group flex flex-col gap-2 p-6 hover:bg-brand-pale/20 transition-colors">
                  <p className="text-[11px] tracking-[0.18em] uppercase text-brand">{item.cta}</p>
                  <p className="font-serif text-lg font-light text-stone-800 group-hover:text-brand transition-colors">{item.title}</p>
                  <p className="text-xs text-stone-400">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <p className="text-[11px] tracking-[0.2em] uppercase text-brand mb-2">Odgovori</p>
            <h2 className="font-serif text-3xl font-light text-stone-800 speakable">Pogosta vprašanja</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-px">
            {[
              { q: "Kaj so zavestni dogodki?", a: "Zavestni dogodki so prireditve, ki spodbujajo osebnostno rast, dobro počutje in duhovno zavedanje — joga delavnice, meditacijski tečaji, breathwork (dihalne vaje), zvočne kopeli, kakao ceremonije in yoga retreati. Zavestni Dogodki je kurirani imenik tovrstnih prireditev po vsej Sloveniji." },
              { q: "Kje najdem joga delavnice in meditacijo v Sloveniji?", a: "Zavestni Dogodki zbira vse joga delavnice, meditacijske tečaje, breathwork seje, zvočne kopeli in retreate v Sloveniji na enem mestu. Filtrirate lahko po mestu (Ljubljana, Maribor, Koper, Bled...), kategoriji in datumu. Večina prireditev je v Ljubljani in Mariboru, a pogosto najdemo tudi dogodke v naravi po vsej Sloveniji." },
              { q: "Koliko stane breathwork delavnica ali zvočna kopel?", a: "Skupinske breathwork delavnice in zvočne kopeli v Sloveniji stanejo med 15 in 35 EUR za 60–90-minutno sejo. Yoga retreati (vikend all-inclusive) so od 150 do 400 EUR. Kakao ceremonije so tipično 20–40 EUR. Pogosti so tudi brezplačni uvodni dogodki — filtrirajte po »brezplačno« na naši strani." },
              { q: "Kaj je yoga retreat in kako ga izbrati?", a: "Yoga retreat je večdnevni odmik z intenzivno joga prakso, meditacijo, zdravo hrano in naravnim okoljem. Slovenija nudi odlične lokacije — Bled, Bohinj, Julijske Alpe in jadransko obalo. Pri izbiri upoštevajte: raven zahtevnosti (začetniki vs. napredni), profil inštruktorja, velikost skupine (idealno do 12 udeležencev) in lokacijo." },
              { q: "Kako objavim zavestni dogodek na Zavestni Dogodki?", a: "Objavo oddate prek obrazca na strani /submit. V času otvoritve je objava brezplačna za vse facilitatorje. Vaš dogodek bo pregledan in objavljen v roku 24 ur. Na voljo sta dve možnosti: osnovna objava (30 dni vidljivost) in izpostavljena objava (60 dni + newsletter)." },
              { q: "Ali je zvočna kopel primerna za začetnike?", a: "Da — zvočna kopel je ena najprimernejših praks za začetnike. Ne zahteva predznanja, fizične pripravljenosti ali meditacijske izkušnje. Udeleženci preprosto ležijo, medtem ko vodja igra Tibetanske posode, gong in kristalne posode. Večina udeležencev poroča o globoki sprostitvi že po prvi seji." },
            ].map(({ q, a }) => (
              <details key={q} className="group border-b border-stone-100 last:border-0">
                <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer text-sm font-medium text-stone-700 hover:text-brand transition-colors list-none">
                  {q}
                  <span className="flex-shrink-0 text-stone-300 group-open:rotate-180 transition-transform">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-5 text-stone-500 text-sm leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-xs text-stone-400 text-center tracking-wide">
            Imate več vprašanj?{" "}
            <Link href="/blog" className="text-brand hover:underline">Preberite naš blog →</Link>
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { CATEGORY_EMOJI, CATEGORY_LABEL, ALL_CATEGORIES } from "@/lib/utils";
import type { EventCategory } from "@conscious-slovenia/database";

type Props = { params: Promise<{ city: string }> };

// Canonical city slugs → display names + SEO data
const CITIES: Record<string, { label: string; description: string; region: string }> = {
  ljubljana: {
    label: "Ljubljana",
    region: "Osrednjeslovenska",
    description: "Zavestni dogodki v Ljubljani — joga delavnice, meditacija, breathwork, zvočne kopeli in retreati v slovenski prestolnici. Filtriraj po datumu in kategoriji.",
  },
  maribor: {
    label: "Maribor",
    region: "Podravska",
    description: "Zavestni dogodki v Mariboru — joga, meditacija, breathwork in retreati v drugem največjem mestu v Sloveniji.",
  },
  koper: {
    label: "Koper",
    region: "Obalno-kraška",
    description: "Zavestni dogodki v Kopru in na Primorskem — joga ob morju, meditacija, zvočne kopeli in retreati na slovenski obali.",
  },
  bled: {
    label: "Bled",
    region: "Gorenjska",
    description: "Zavestni dogodki na Bledu — joga, meditacija in retreati ob kristalno čistem jezeru. Edinstvena naravna kulisa za zavestne prakse.",
  },
  "kranjska-gora": {
    label: "Kranjska Gora",
    region: "Gorenjska",
    description: "Zavestni dogodki v Kranjski Gori — yoga retreati, meditacija in wellness v srcu Triglavskega narodnega parka.",
  },
  celje: {
    label: "Celje",
    region: "Savinjska",
    description: "Zavestni dogodki v Celju — joga delavnice, meditacijski tečaji, breathwork in zavestne prireditve v Savinjski regiji.",
  },
  kranj: {
    label: "Kranj",
    region: "Gorenjska",
    description: "Zavestni dogodki v Kranju — joga, meditacija, breathwork in retreati v Gorenjski regiji.",
  },
  piran: {
    label: "Piran",
    region: "Obalno-kraška",
    description: "Zavestni dogodki v Piranu — joga ob morju, meditacija in retreati v najlepšem mestnem biseru slovenske obale.",
  },
  portoroz: {
    label: "Portorož",
    region: "Obalno-kraška",
    description: "Zavestni dogodki v Portorožu — wellness retreati, joga, meditacija in zvočne kopeli na slovenski rivieri.",
  },
  "nova-gorica": {
    label: "Nova Gorica",
    region: "Goriška",
    description: "Zavestni dogodki v Novi Gorici — joga delavnice, meditacija, breathwork in retreati v Goriški regiji.",
  },
  "novo-mesto": {
    label: "Novo Mesto",
    region: "Jugovzhodna Slovenija",
    description: "Zavestni dogodki v Novem Mestu — joga, meditacija, zvočne kopeli in zavestne prireditve v Dolenjski regiji.",
  },
};

const ALL_CITY_SLUGS = Object.keys(CITIES);

export async function generateStaticParams() {
  return ALL_CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const data = CITIES[city];
  if (!data) return { title: "Mesto ni najdeno" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  return {
    title: { absolute: `Zavestni Dogodki v ${data.label} — Joga, Meditacija & Retreati | Zavestni Dogodki` },
    description: data.description,
    keywords: [
      `zavestni dogodki ${data.label.toLowerCase()}`,
      `joga ${data.label.toLowerCase()}`,
      `meditacija ${data.label.toLowerCase()}`,
      `retreat ${data.label.toLowerCase()}`,
      `breathwork ${data.label.toLowerCase()}`,
      "zavestni dogodki slovenija",
    ],
    alternates: { canonical: `${appUrl}/eventi/${city}` },
    openGraph: {
      title: `Zavestni Dogodki v ${data.label} 2026`,
      description: data.description,
      url: `${appUrl}/eventi/${city}`,
      type: "website",
      locale: "sl_SI",
      siteName: "Zavestni Dogodki",
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { city } = await params;
  const data = CITIES[city];
  if (!data) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  // Case-insensitive city match — try both venue.city and venueName contains
  const [events, total] = await Promise.all([
    db.event.findMany({
      where: {
        status: { in: ["APPROVED", "FEATURED"] },
        date: { gte: new Date() },
        OR: [
          { venue: { city: { equals: data.label, mode: "insensitive" } } },
          { venueName: { contains: data.label, mode: "insensitive" } },
        ],
      },
      orderBy: [{ featured: "desc" }, { date: "asc" }],
      take: 24,
      include: { organizer: true, venue: true },
    }),
    db.event.count({
      where: {
        status: { in: ["APPROVED", "FEATURED"] },
        date: { gte: new Date() },
        OR: [
          { venue: { city: { equals: data.label, mode: "insensitive" } } },
          { venueName: { contains: data.label, mode: "insensitive" } },
        ],
      },
    }),
  ]);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Dogodki", item: `${appUrl}/events` },
      { "@type": "ListItem", position: 3, name: data.label, item: `${appUrl}/eventi/${city}` },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Zavestni Dogodki v ${data.label}`,
    description: data.description,
    url: `${appUrl}/eventi/${city}`,
    inLanguage: "sl",
    breadcrumb: breadcrumbSchema,
  };

  const otherCities = ALL_CITY_SLUGS.filter((c) => c !== city);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-8">
        <Link href="/" className="hover:text-stone-600">Domov</Link>
        <span>/</span>
        <Link href="/events" className="hover:text-stone-600">Dogodki</Link>
        <span>/</span>
        <span className="text-stone-700">{data.label}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="text-5xl mb-4">📍</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">
          Zavestni dogodki v {data.label} — 2026
        </h1>
        <p className="text-stone-500 mb-4">
          {total} {total === 1 ? "dogodek" : "dogodkov"} · prihajajoče
        </p>
        <p className="text-stone-600 text-base leading-relaxed max-w-2xl">
          {data.description}
        </p>
      </div>

      {/* Category quick-filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {ALL_CATEGORIES.filter((c) => c !== "OTHER").map((cat) => (
          <Link
            key={cat}
            href={`/events?category=${cat}&city=${data.label}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-stone-600 text-sm rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
          >
            {CATEGORY_EMOJI[cat]} {CATEGORY_LABEL[cat as EventCategory]}
          </Link>
        ))}
      </div>

      {/* Events grid */}
      {events.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-5xl mb-4">🌿</p>
          <p className="text-lg mb-2">Ni prihajajočih dogodkov v {data.label}.</p>
          <p className="text-sm mb-6">Preverite kmalu ali si oglejte vse dogodke v Sloveniji.</p>
          <Link href="/events" className="inline-block text-emerald-700 hover:underline text-sm">
            Vsi dogodki →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {events.map((e) => (
            <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />
          ))}
        </div>
      )}

      {/* Other cities */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-stone-700 mb-4">Dogodki v drugih mestih</h2>
        <div className="flex flex-wrap gap-2">
          {otherCities.map((c) => (
            <Link
              key={c}
              href={`/eventi/${c}`}
              className="px-4 py-2 bg-white border border-stone-200 text-stone-600 text-sm rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
            >
              📍 {CITIES[c].label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

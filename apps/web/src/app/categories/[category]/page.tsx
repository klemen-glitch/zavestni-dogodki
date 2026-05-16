export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { CATEGORY_EMOJI, CATEGORY_LABEL, ALL_CATEGORIES } from "@/lib/utils";
import type { EventCategory } from "@conscious-slovenia/database";

type Props = { params: Promise<{ category: string }> };

// Keyword-rich category descriptions for SEO
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  YOGA: "Najdite joga delavnice, tečaje in retreate v Sloveniji. Od začetnikov do naprednih — hatha, vinyasa, yin joga in več.",
  MEDITATION: "Meditacijski tečaji, vodene meditacije in mindfulness delavnice v Sloveniji. Notranji mir in zavestnost.",
  BREATHWORK: "Dihalne vaje in breathwork delavnice v Sloveniji. Holotropno dihanje, pranayama in transformativni dih.",
  SOUND_BATH: "Zvočne kopeli z Tibetanskimi posodami, gongom in kristalnimi posodami v Sloveniji. Zvočno zdravljenje.",
  CACAO_CEREMONY: "Kakao ceremonije v Sloveniji. Srčno odpirajoče skupnostne prireditve z ceremonialnim kakaom.",
  RETREAT: "Wellness retreati in zavestni retreati v Sloveniji. Weekend in večdnevni odmiki za telo, um in dušo.",
  WORKSHOP: "Zavestne delavnice in seminarji v Sloveniji. Osebna rast, duhovnost in holistično zdravje.",
  DANCE: "Zavestni ples, ecstatic dance in gibalne delavnice v Sloveniji. Svobodna izražanje skozi ples.",
  TANTRA: "Tantra delavnice in seminarji v Sloveniji. Zavestno partnerstvo, energija in celovitost.",
  HEALING: "Zdravilne prireditve in delavnice v Sloveniji. Energijsko zdravljenje, reiki, zvočno in holistično.",
  OTHER: "Zavestni dogodki v Sloveniji — duhovnost, osebna rast in celostno zdravje.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const upper = category.toUpperCase();
  if (!ALL_CATEGORIES.includes(upper as EventCategory)) return { title: "Kategorija ni najdena" };
  const label = CATEGORY_LABEL[upper] ?? upper;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const description = CATEGORY_DESCRIPTIONS[upper] ?? `Vsi ${label.toLowerCase()} dogodki v Sloveniji.`;
  return {
    title: `${label} v Sloveniji 2026 — Delavnice & Retreati`,
    description,
    keywords: [label, `${label} slovenija`, `${label} ljubljana`, `${label} delavnica`, "zavestni dogodki", "holistic events slovenia"],
    alternates: { canonical: `${appUrl}/categories/${category.toLowerCase()}` },
    openGraph: {
      title: `${label} v Sloveniji 2026`,
      description,
      url: `${appUrl}/categories/${category.toLowerCase()}`,
      type: "website",
      locale: "sl_SI",
      siteName: "Zavestni Dogodki",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const upper = category.toUpperCase() as EventCategory;

  if (!ALL_CATEGORIES.includes(upper as EventCategory)) notFound();

  const label = CATEGORY_LABEL[upper] ?? upper;
  const emoji = CATEGORY_EMOJI[upper] ?? "🌸";

  const [events, total] = await Promise.all([
    db.event.findMany({
      where: { category: upper, status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } },
      orderBy: [{ featured: "desc" }, { date: "asc" }],
      take: 24,
      include: { organizer: true, venue: true },
    }),
    db.event.count({
      where: { category: upper, status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } },
    }),
  ]);

  // Other categories to suggest
  const otherCats = ALL_CATEGORIES.filter((c) => c !== upper && c !== "OTHER");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Dogodki", item: `${appUrl}/events` },
      { "@type": "ListItem", position: 3, name: label, item: `${appUrl}/categories/${upper.toLowerCase()}` },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-8">
        <Link href="/" className="hover:text-stone-600">Domov</Link>
        <span>/</span>
        <Link href="/events" className="hover:text-stone-600">Dogodki</Link>
        <span>/</span>
        <span className="text-stone-700">{label}</span>
      </div>

      {/* Header — H1 with location keyword for SEO */}
      <div className="mb-10">
        <div className="text-5xl mb-4">{emoji}</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">{label} v Sloveniji — Delavnice &amp; Retreati 2026</h1>
        <p className="text-stone-500">{total} {total === 1 ? "dogodek" : "dogodkov"} · prihajajoče</p>
      </div>

      {/* Events grid */}
      {events.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-5xl mb-4">{emoji}</p>
          <p className="text-lg mb-2">Ni prihajajoči {label.toLowerCase()} dogodkov.</p>
          <p className="text-sm">Preverite kmalu ali si oglejte druge kategorije.</p>
          <Link href="/events" className="inline-block mt-6 text-emerald-700 hover:underline text-sm">
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

      {/* Other categories */}
      <section>
        <h2 className="text-xl font-bold text-stone-700 mb-4">Ostale kategorije</h2>
        <div className="flex flex-wrap gap-2">
          {otherCats.map((c) => (
            <Link key={c} href={`/categories/${c.toLowerCase()}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 text-stone-600 text-sm rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors">
              {CATEGORY_EMOJI[c]} {CATEGORY_LABEL[c]}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

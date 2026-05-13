export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { CATEGORY_EMOJI, CATEGORY_LABEL, ALL_CATEGORIES } from "@/lib/utils";

async function getHomeData() {
  const now = new Date();
  const [featured, upcoming, stats] = await Promise.all([
    db.event.findMany({
      where: { status: "FEATURED", date: { gte: now } },
      orderBy: { date: "asc" },
      take: 3,
      include: { organizer: true, venue: true },
    }),
    db.event.findMany({
      where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: now } },
      orderBy: { date: "asc" },
      take: 9,
      include: { organizer: true, venue: true },
    }),
    db.event.count({ where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: now } } }),
  ]);
  return { featured, upcoming, stats };
}

export default async function HomePage() {
  const { featured, upcoming, stats } = await getHomeData();

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="text-6xl mb-6">🌿</div>
        <h1 className="text-4xl md:text-6xl font-bold text-stone-800 mb-4 leading-tight">
          Zavestni dogodki<br />
          <span className="text-emerald-700">v Sloveniji</span>
        </h1>
        <p className="text-xl text-stone-500 max-w-xl mx-auto mb-8">
          Kurirani imenik joge, meditacije, dihalnih vaj, zvočnih kopeli in zavestnih prireditev.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/events" className="bg-emerald-700 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-emerald-800 transition-colors">
            Poišči dogodek
          </Link>
          <Link href="/submit" className="border border-stone-300 text-stone-700 px-8 py-3 rounded-full text-lg font-medium hover:bg-stone-100 transition-colors">
            Dodaj svoj dogodek
          </Link>
        </div>
        {stats > 0 && (
          <p className="text-stone-400 text-sm mt-6">{stats} aktivnih dogodkov po vsej Sloveniji</p>
        )}
      </section>

      {/* Featured */}
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

      {/* Categories */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Kategorije</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ALL_CATEGORIES.filter(c => c !== "OTHER").map((cat) => (
            <Link key={cat} href={`/events?category=${cat}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-stone-100 hover:border-emerald-300 hover:shadow-md transition-all group">
              <span className="text-3xl">{CATEGORY_EMOJI[cat]}</span>
              <span className="text-xs font-medium text-stone-600 text-center group-hover:text-emerald-700">{CATEGORY_LABEL[cat]}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming events */}
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

      {/* Newsletter */}
      <section id="newsletter" className="mb-20">
        <NewsletterSignup />
      </section>
    </div>
  );
}

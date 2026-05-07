import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { ShareButtons } from "@/components/ShareButtons";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_COLOR, formatDate, formatTime, formatPrice } from "@/lib/utils";

async function getEvent(slug: string) {
  const event = await db.event.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: { organizer: true, venue: true },
  });
  if (event) {
    await db.event.update({ where: { id: event.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }
  return event;
}

async function getRelated(category: string, currentId: string) {
  return db.event.findMany({
    where: { category: category as never, id: { not: currentId }, status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } },
    take: 3,
    orderBy: { date: "asc" },
    include: { organizer: true, venue: true },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Dogodek ni najden" };
  return {
    title: event.titleEn,
    description: event.shortDescEn ?? event.descriptionEn.slice(0, 160),
    openGraph: {
      title: event.titleEn,
      description: event.shortDescEn ?? event.descriptionEn.slice(0, 160),
      images: event.imageUrl ? [{ url: event.imageUrl }] : [],
    },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, related] = await Promise.all([getEvent(slug), db.event.findFirst({ where: { OR: [{ slug }, { id: slug }] } }).then(e => e ? getRelated(e.category, e.id) : [])]);

  if (!event) notFound();

  const emoji = CATEGORY_EMOJI[event.category] ?? "🌸";
  const label = CATEGORY_LABEL[event.category] ?? "Dogodek";
  const colorClass = CATEGORY_COLOR[event.category] ?? "bg-gray-100 text-gray-800";
  const time = formatTime(event.date);
  const endTime = event.endDate ? formatTime(event.endDate) : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const eventUrl = `${appUrl}/events/${event.slug ?? event.id}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/events" className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-700 text-sm mb-6">
        ← Nazaj na dogodke
      </Link>

      {/* Image */}
      {event.imageUrl && (
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
          <Image src={event.imageUrl} alt={event.titleEn} fill className="object-cover" priority />
        </div>
      )}

      {/* Category badge */}
      <span className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full mb-4 ${colorClass}`}>
        {emoji} {label}
      </span>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-2">{event.titleEn}</h1>
      {event.titleSl && event.titleSl !== event.titleEn && (
        <p className="text-stone-400 text-lg mb-6 italic">{event.titleSl}</p>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-white rounded-2xl border border-stone-100">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Datum</p>
          <p className="font-medium text-stone-800">{formatDate(event.date)}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Čas</p>
          <p className="font-medium text-stone-800">{time || "Ni določen"}{endTime ? ` – ${endTime}` : ""}</p>
        </div>
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Lokacija</p>
          <p className="font-medium text-stone-800">{event.venue?.name ?? event.venueName ?? "Ni določena"}</p>
          {event.venue?.address && <p className="text-sm text-stone-400">{event.venue.address}</p>}
        </div>
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Cena</p>
          <p className="font-semibold text-emerald-700 text-lg">{formatPrice(event.price, event.priceNote)}</p>
        </div>
        {event.organizer && (
          <div className="col-span-2">
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Organizator</p>
            <p className="font-medium text-stone-800">{event.organizer.name}</p>
            {event.organizer.instagram && (
              <a href={`https://instagram.com/${event.organizer.instagram.replace("@", "")}`} target="_blank"
                className="text-sm text-emerald-600 hover:underline">{event.organizer.instagram}</a>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="prose prose-stone max-w-none mb-8">
        <h2 className="text-lg font-semibold text-stone-700 mb-3">O dogodku</h2>
        <p className="text-stone-600 leading-relaxed whitespace-pre-line">{event.descriptionEn}</p>
        {event.descriptionSl && (
          <p className="text-stone-400 text-sm mt-4 leading-relaxed whitespace-pre-line border-t pt-4">{event.descriptionSl}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        {event.sourceUrl && (
          <a href={event.sourceUrl} target="_blank" rel="noopener"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            📘 Odpri na Facebooku
          </a>
        )}
        <a href={`/api/events/${event.slug ?? event.id}/ical`}
          className="inline-flex items-center gap-2 bg-stone-100 text-stone-700 px-5 py-2.5 rounded-xl font-medium hover:bg-stone-200 transition-colors">
          📅 Dodaj v koledar
        </a>
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {event.tags.map((tag) => (
            <Link key={tag} href={`/events?q=${tag}`}
              className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Share */}
      <div className="mb-12">
        <ShareButtons title={event.titleEn} url={eventUrl} />
      </div>

      {/* Related events */}
      {related.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-stone-800 mb-4">Podobni dogodki</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((e) => (
              <Link key={e.id} href={`/events/${e.slug ?? e.id}`}
                className="p-4 bg-white rounded-xl border border-stone-100 hover:border-emerald-300 transition-colors">
                <p className="font-medium text-stone-800 text-sm line-clamp-2">{e.titleEn}</p>
                <p className="text-xs text-stone-400 mt-1">{formatDate(e.date, { day: "numeric", month: "short" })}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <NewsletterSignup compact />
    </div>
  );
}

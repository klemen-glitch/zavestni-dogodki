import Link from "next/link";
import Image from "next/image";
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_HEX, formatDate, formatTime, formatPrice } from "@/lib/utils";

interface SponsoredEvent {
  id: string;
  slug: string | null;
  titleSl: string | null;
  titleEn: string;
  date: Date;
  price: number | null;
  priceNote: string | null;
  category: string;
  imageUrl: string | null;
  venueName: string | null;
  organizer?: { name: string; avatarUrl?: string | null } | null;
  venue?: { name: string | null; city: string | null } | null;
}

interface Props {
  events: SponsoredEvent[];
}

export function SponsoredStrip({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">⭐ Izpostavljeni dogodki</h2>
        </div>
        <Link
          href="/events?featured=true"
          className="text-xs text-emerald-700 hover:underline font-medium"
        >
          Vsi izpostavljeni →
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {events.map((event) => (
          <SponsoredCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function SponsoredCard({ event }: { event: SponsoredEvent }) {
  const href = `/events/${event.slug ?? event.id}`;
  const title = event.titleSl ?? event.titleEn;
  const [catColor, catDark] = CATEGORY_HEX[event.category] ?? ["#2d6a4f", "#064e3b"];
  const emoji = CATEGORY_EMOJI[event.category] ?? "🌸";
  const label = CATEGORY_LABEL[event.category] ?? "Dogodek";
  const time = formatTime(event.date);
  const location = event.venue?.name ?? event.venueName ?? "";
  const city = event.venue?.city ?? "";

  return (
    <Link
      href={href}
      className="group flex-shrink-0 w-64 bg-white rounded-2xl overflow-hidden shadow-sm border border-amber-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
      style={{ boxShadow: `0 0 0 1.5px ${catColor}22, 0 2px 8px rgba(0,0,0,0.06)` }}
    >
      {/* Image */}
      <div className="relative h-32 overflow-hidden">
        {event.imageUrl ? (
          <>
            <Image
              src={event.imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="256px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${catColor}, ${catDark})` }}>
            <span className="text-5xl opacity-25">{emoji}</span>
          </div>
        )}

        {/* Category pill */}
        <span
          className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${catColor}dd` }}
        >
          {emoji} {label}
        </span>

        {/* Sponsored badge */}
        <span className="absolute top-2 right-2 bg-amber-400/90 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
          ⭐ Top
        </span>

        {/* Facilitator avatar */}
        {event.organizer?.avatarUrl && (
          <div className="absolute bottom-[-14px] right-3 z-10">
            <div className="w-8 h-8 rounded-full border-2 border-white shadow overflow-hidden bg-stone-200">
              <Image
                src={event.organizer.avatarUrl}
                alt={event.organizer.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-3 ${event.organizer?.avatarUrl ? "pt-5" : "pt-3"}`}>
        <h3 className="font-semibold text-stone-800 text-sm leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
          {title}
        </h3>
        <p className="text-[11px] text-stone-400 mt-1.5">
          📅 {formatDate(event.date, { weekday: "short", day: "numeric", month: "short" })}{time ? ` · ${time}` : ""}
        </p>
        {(location || city) && (
          <p className="text-[11px] text-stone-400 mt-0.5 truncate">
            📍 {[location, city].filter(Boolean).join(", ")}
          </p>
        )}
        <p className="text-xs font-bold mt-2" style={{ color: catColor }}>
          {formatPrice(event.price, event.priceNote)}
        </p>
      </div>
    </Link>
  );
}

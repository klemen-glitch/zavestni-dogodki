import Link from "next/link";
import Image from "next/image";
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_COLOR, formatDate, formatTime, formatPrice } from "@/lib/utils";

interface EventCardProps {
  event: {
    id: string;
    slug: string | null;
    titleSl: string | null;
    titleEn: string;
    shortDescEn: string | null;
    date: Date;
    endDate: Date | null;
    price: number | null;
    priceNote: string | null;
    category: string;
    imageUrl: string | null;
    venueName: string | null;
    featured: boolean;
    organizer?: { name: string } | null;
    venue?: { name: string; city: string } | null;
  };
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const href = `/events/${event.slug ?? event.id}`;
  const title = event.titleSl ?? event.titleEn;
  const emoji = CATEGORY_EMOJI[event.category] ?? "🌸";
  const label = CATEGORY_LABEL[event.category] ?? "Dogodek";
  const colorClass = CATEGORY_COLOR[event.category] ?? "bg-gray-100 text-gray-800";
  const time = formatTime(event.date);
  const location = event.venue?.name ?? event.venueName ?? "Kraj TBD";

  return (
    <Link href={href} className={`group block bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${event.featured ? "ring-2 ring-amber-400" : ""}`}>
      {/* Image */}
      <div className={`relative bg-gradient-to-br from-emerald-50 to-teal-100 ${compact ? "h-32" : "h-44"}`}>
        {event.imageUrl ? (
          <Image src={event.imageUrl} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={compact ? "text-4xl" : "text-6xl"}>{emoji}</span>
          </div>
        )}
        {event.featured && (
          <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
            ⭐ Izpostavljeno
          </span>
        )}
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
          {emoji} {label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className={`font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors line-clamp-2 ${compact ? "text-sm" : "text-base"}`}>
          {title}
        </h3>

        {!compact && event.shortDescEn && (
          <p className="text-stone-500 text-sm mt-1 line-clamp-2">{event.shortDescEn}</p>
        )}

        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>📅</span>
            <span>{formatDate(event.date, { weekday: "short", day: "numeric", month: "short" })}{time ? ` · ${time}` : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>📍</span>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-emerald-700">
              {formatPrice(event.price, event.priceNote)}
            </span>
            {event.organizer && (
              <span className="text-xs text-stone-400 truncate max-w-[120px]">{event.organizer.name}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import Image from "next/image";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  CATEGORY_HEX,
  formatDate,
  formatTime,
  formatPrice,
} from "@/lib/utils";

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
    organizer?: { name: string; avatarUrl?: string | null } | null;
    venue?: { name: string; city: string } | null;
  };
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const href = `/events/${event.slug ?? event.id}`;
  const title = event.titleSl ?? event.titleEn;
  const emoji = CATEGORY_EMOJI[event.category] ?? "🌸";
  const label = CATEGORY_LABEL[event.category] ?? "Dogodek";
  const [catColor, catDark] = CATEGORY_HEX[event.category] ?? ["#57534e", "#292524"];
  const time = formatTime(event.date);
  const location = event.venue?.name ?? event.venueName ?? "Kraj TBD";

  return (
    <Link
      href={href}
      className={`group block bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
        event.featured ? "ring-2 ring-amber-400 shadow-amber-100/50" : "shadow-sm border border-stone-100"
      }`}
    >
      {/* ── Image section ── */}
      <div className={`relative ${compact ? "h-40" : "h-52"} overflow-hidden`}>
        {event.imageUrl ? (
          <>
            {/* Full-bleed event image */}
            <Image
              src={event.imageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            {/* Dark gradient overlay at bottom for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {/* Subtle brand color tint at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1/3 opacity-40"
              style={{ background: `linear-gradient(to top, ${catDark}, transparent)` }}
            />
          </>
        ) : (
          /* No image — full branded gradient */
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${catColor}, ${catDark})` }}
          >
            {/* Botanical decoration */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.08]" viewBox="0 0 400 300" fill="none">
              <circle cx="300" cy="60" r="80" stroke="white" strokeWidth="1" />
              <circle cx="300" cy="60" r="55" stroke="white" strokeWidth="0.8" />
              <path d="M260 200 Q300 150 340 200 Q300 180 260 200Z" fill="white" opacity="0.4" />
              <path d="M220 250 Q280 190 340 250 Q280 225 220 250Z" fill="white" opacity="0.3" />
            </svg>
            <span className="text-7xl opacity-25 select-none">{emoji}</span>
          </div>
        )}

        {/* Category badge — top right */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className="text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: `${catColor}cc` }}
          >
            {emoji} {label}
          </span>
        </div>

        {/* Featured badge — top left */}
        {event.featured && (
          <span className="absolute top-3 left-3 bg-amber-400/90 backdrop-blur-sm text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10">
            ⭐ Izpostavljeno
          </span>
        )}

        {/* Facilitator avatar — bottom right, overlaps content section */}
        {event.organizer && (
          <div className="absolute bottom-[-18px] right-4 z-20">
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-stone-200 flex items-center justify-center flex-shrink-0">
              {event.organizer.avatarUrl ? (
                <Image
                  src={event.organizer.avatarUrl}
                  alt={event.organizer.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span
                  className="text-white text-xs font-bold"
                  style={{ backgroundColor: catColor }}
                >
                  {event.organizer.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Content section ── */}
      <div className={`relative p-4 ${event.organizer ? "pt-6" : "pt-4"}`}>
        <h3
          className={`font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors line-clamp-2 ${
            compact ? "text-sm" : "text-base"
          } ${event.organizer ? "pr-2" : ""}`}
        >
          {title}
        </h3>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>📅</span>
            <span>
              {formatDate(event.date, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {time ? ` · ${time}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <span>📍</span>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
            <span className="text-sm font-semibold" style={{ color: catColor }}>
              {formatPrice(event.price, event.priceNote)}
            </span>
            {event.organizer && (
              <span className="text-xs text-stone-400 truncate max-w-[110px] text-right">
                {event.organizer.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

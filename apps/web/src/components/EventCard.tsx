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
      className={`group block bg-white rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${
        event.featured ? "ring-1 ring-brand/30 shadow-sm" : "shadow-sm border border-stone-100"
      }`}
    >
      {/* ── Image section ── */}
      <div className={`relative ${compact ? "h-40" : "h-52"} overflow-hidden`}>
        {event.imageUrl ? (
          <>
            {/* Full-bleed event image */}
            <Image
              src={event.imageUrl}
              alt={`${title} — ${label} v ${event.venue?.city ?? event.venueName ?? "Sloveniji"}`}
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
          /* No image — editorial text card */
          <div
            className="absolute inset-0 flex flex-col justify-between p-4 overflow-hidden"
            style={{ background: `linear-gradient(145deg, ${catColor}0d 0%, ${catDark}18 100%)` }}
          >
            {/* Decorative circles — top right */}
            <svg className="absolute top-0 right-0 w-3/4 h-full opacity-[0.07]" viewBox="0 0 180 180" fill="none">
              <circle cx="160" cy="30" r="120" stroke={catColor} strokeWidth="1"/>
              <circle cx="160" cy="30" r="75" stroke={catColor} strokeWidth="0.8"/>
              <circle cx="160" cy="30" r="35" stroke={catColor} strokeWidth="0.6"/>
            </svg>
            {/* Category label top-left */}
            <span className="text-[9px] tracking-[0.18em] uppercase font-medium relative z-10"
              style={{ color: catColor }}>
              {label}
            </span>
            {/* Title bottom */}
            <p className="font-serif text-lg font-light text-stone-800 leading-snug line-clamp-3 relative z-10">
              {title}
            </p>
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
          <span className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-brand text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm z-10 tracking-widest uppercase">
            Izpostavljeno
          </span>
        )}

        {/* Facilitator avatar — bottom right, sits at image bottom edge */}
        {event.organizer && (
          <div className="absolute bottom-0 right-4 z-20 translate-y-1/2">
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-stone-200 flex items-center justify-center flex-shrink-0">
              {event.organizer.avatarUrl ? (
                <Image
                  src={event.organizer.avatarUrl}
                  alt={event.organizer.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover [object-position:50%_20%]"
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
      <div className={`relative p-4 ${event.organizer ? "pt-7" : "pt-4"}`}>
        <h3
          className={`font-medium text-stone-800 group-hover:text-brand transition-colors line-clamp-2 ${
            compact ? "text-sm" : "text-base"
          } ${event.organizer ? "pr-2" : ""}`}
        >
          {title}
        </h3>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <span>
              {formatDate(event.date, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {time ? ` · ${time}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
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

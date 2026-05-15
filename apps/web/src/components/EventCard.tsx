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
      {/* ── Image section: diagonal split ── */}
      <div className={`relative ${compact ? "h-36" : "h-52"} overflow-hidden`}>
        {/* Branded gradient background (right side) */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${catColor} 0%, ${catDark} 100%)`,
          }}
        >
          {/* Decorative botanical SVG */}
          <svg
            className="absolute right-0 top-0 h-full w-3/5 opacity-[0.07] pointer-events-none"
            viewBox="0 0 200 300"
            fill="none"
          >
            <circle cx="150" cy="60" r="50" stroke="white" strokeWidth="0.5" />
            <circle cx="150" cy="60" r="35" stroke="white" strokeWidth="0.5" />
            <circle cx="150" cy="60" r="20" stroke="white" strokeWidth="0.5" />
            <path
              d="M130 160 Q158 115 170 160 Q158 145 130 160Z"
              fill="white"
              opacity="0.4"
            />
            <path
              d="M108 205 Q143 155 168 205 Q143 185 108 205Z"
              fill="white"
              opacity="0.3"
            />
            <path
              d="M140 245 Q163 210 175 245 Q163 232 140 245Z"
              fill="white"
              opacity="0.25"
            />
            <circle cx="180" cy="135" r="3" fill="white" opacity="0.3" />
            <circle cx="120" cy="270" r="3" fill="white" opacity="0.2" />
          </svg>

          {/* Large watermark emoji */}
          <span className="absolute right-4 bottom-4 text-5xl opacity-[0.15] select-none">
            {emoji}
          </span>

          {/* Category label */}
          <span className="absolute top-3 right-3 text-white/80 text-[11px] font-medium tracking-widest uppercase z-10">
            {label}
          </span>
        </div>

        {/* Event image with diagonal clip */}
        {event.imageUrl ? (
          <>
            <div
              className="absolute inset-0"
              style={{ clipPath: "polygon(0 0, 72% 0, 56% 100%, 0 100%)" }}
            >
              <Image
                src={event.imageUrl}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            {/* Soft gradient along diagonal edge */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                clipPath: "polygon(67% 0, 74% 0, 58% 100%, 51% 100%)",
                background: `linear-gradient(to right, rgba(0,0,0,0.1), ${catColor}bb)`,
              }}
            />
          </>
        ) : (
          /* No image — show large emoji on branded bg */
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl opacity-20">{emoji}</span>
          </div>
        )}

        {/* Featured badge */}
        {event.featured && (
          <span className="absolute top-3 left-3 bg-amber-400/90 backdrop-blur-sm text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm z-10">
            ⭐ Izpostavljeno
          </span>
        )}
      </div>

      {/* ── Content section ── */}
      <div className="relative p-4">
        {/* Category accent line */}
        <div
          className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
          style={{ backgroundColor: catColor }}
        />

        <h3
          className={`font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors line-clamp-2 mt-1 ${
            compact ? "text-sm" : "text-base"
          }`}
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
              <span className="text-xs text-stone-400 truncate max-w-[120px]">
                {event.organizer.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

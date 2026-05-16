import type { PartnerAd } from "@/lib/ads";

interface Props {
  ad: PartnerAd;
}

export function NativeAdCard({ ad }: Props) {
  return (
    <a
      href={ad.href}
      target={ad.href.startsWith("http") ? "_blank" : undefined}
      rel={ad.href.startsWith("http") ? "noopener noreferrer sponsored" : undefined}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm border border-stone-100"
    >
      {/* Image / branded header */}
      <div className="relative h-40 overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ad.colorFrom}, ${ad.colorTo})` }}>
        {/* Decorative pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" viewBox="0 0 400 200" fill="none">
          <circle cx="350" cy="30" r="70" stroke="white" strokeWidth="1" />
          <circle cx="350" cy="30" r="45" stroke="white" strokeWidth="0.8" />
          <path d="M300 150 Q340 110 370 150 Q340 135 300 150Z" fill="white" opacity="0.4" />
          <path d="M260 180 Q310 140 360 180 Q310 160 260 180Z" fill="white" opacity="0.3" />
        </svg>

        {/* Large emoji */}
        <span className="text-6xl z-10 group-hover:scale-110 transition-transform duration-300 select-none drop-shadow-lg">
          {ad.emoji}
        </span>

        {/* Tag pill — top left */}
        <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">
          {ad.tag}
        </span>

        {/* "Oglas" badge — top right */}
        <span className="absolute top-3 right-3 bg-black/25 backdrop-blur-sm text-white/80 text-[10px] font-medium px-2 py-0.5 rounded-full">
          Oglas
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">{ad.subtitle}</p>
        <h3 className="font-bold text-stone-800 text-base leading-tight mb-2 group-hover:text-emerald-700 transition-colors">
          {ad.title}
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed mb-3 line-clamp-2">{ad.description}</p>
        <span
          className="inline-block text-xs font-bold px-3 py-1.5 rounded-full text-white transition-opacity group-hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${ad.colorFrom}, ${ad.colorTo})` }}
        >
          {ad.cta}
        </span>
      </div>
    </a>
  );
}

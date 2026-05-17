"use client";

import { trackEvent } from "@/lib/gtag";

interface EventLocationMapProps {
  lat: number;
  lng: number;
  venueName: string;
  city: string;
}

export function EventLocationMap({ lat, lng, venueName, city }: EventLocationMapProps) {
  // Show all of Slovenia + marker at venue
  // bbox: west,south,east,north (whole Slovenia)
  const bbox = "13.3,45.35,16.7,46.95";
  const markerStr = `${lat},${lng}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markerStr}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=12/${lat}/${lng}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
      <div className="bg-stone-50 px-4 py-3 flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="text-base">📍</span>
          <div>
            <p className="font-semibold text-stone-800 text-sm">{venueName}</p>
            <p className="text-xs text-stone-500">{city}, Slovenija</p>
          </div>
        </div>
        <a
          href={osmLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("map_direction_click", { venue: venueName, city })}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-medium border border-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          Odpri v zemljevidu →
        </a>
      </div>
      <iframe
        src={src}
        width="100%"
        height="340"
        style={{ border: "none", display: "block" }}
        title={`Lokacija: ${venueName}`}
        loading="lazy"
      />
    </div>
  );
}

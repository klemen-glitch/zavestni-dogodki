"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { SLOVENIAN_REGIONS, CITY_REGION_MAP } from "@/lib/utils";

// All known cities from the database
const SLOVENIAN_CITIES = [
  "Ljubljana",
  "Maribor",
  "Celje",
  "Kranj",
  "Koper",
  "Velenje",
  "Ptuj",
  "Novo Mesto",
  "Nova Gorica",
  "Murska Sobota",
  "Bled",
  "Bohinj",
  "Kranjska Gora",
  "Piran",
  "Portorož",
  "Izola",
  "Postojna",
  "Ajdovščina",
  "Trbovlje",
  "Zagorje",
  "Brežice",
  "Slovenj Gradec",
];

interface Props {
  currentCity?: string;
  currentRegion?: string;
}

export function LocationFilter({ currentCity, currentRegion }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    // When selecting region, clear city; when selecting city, clear region
    if (key === "region") p.delete("city");
    if (key === "city") p.delete("region");
    p.delete("page");
    router.push(`/events?${p.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* City filter */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          📍 Mesto
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setParam("city", null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !currentCity && !currentRegion
                ? "bg-emerald-700 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Vsa mesta
          </button>
          {SLOVENIAN_CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setParam("city", city)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentCity === city
                  ? "bg-emerald-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Region filter */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          🗺️ Regija
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setParam("region", null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !currentRegion && !currentCity
                ? "bg-teal-700 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Vse regije
          </button>
          {SLOVENIAN_REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setParam("region", region)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentRegion === region
                  ? "bg-teal-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

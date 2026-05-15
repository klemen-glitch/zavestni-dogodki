"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";

interface Props {
  currentFree?: boolean;
  currentFeatured?: boolean;
  currentDateRange?: string;
  currentPriceMax?: string;
  currentSortBy?: string;
}

const DATE_RANGES = [
  { value: "today", label: "Danes" },
  { value: "week", label: "Ta teden" },
  { value: "month", label: "Ta mesec" },
  { value: "weekend", label: "Ta vikend" },
];

const SORT_OPTIONS = [
  { value: "date_asc", label: "📅 Datum (najprej)" },
  { value: "price_asc", label: "💰 Cena (najnižja)" },
  { value: "price_desc", label: "💰 Cena (najvišja)" },
  { value: "popular", label: "🔥 Popularnost" },
];

export function EventFilters({
  currentFree,
  currentFeatured,
  currentDateRange,
  currentPriceMax,
  currentSortBy,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [priceInput, setPriceInput] = useState(currentPriceMax ?? "");

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    startTransition(() => router.push(`/events?${p.toString()}`));
  }

  function toggleBool(key: string, current?: boolean) {
    const p = new URLSearchParams(params.toString());
    if (current) p.delete(key);
    else p.set(key, "true");
    p.delete("page");
    startTransition(() => router.push(`/events?${p.toString()}`));
  }

  function applyPriceMax() {
    const p = new URLSearchParams(params.toString());
    if (priceInput && Number(priceInput) > 0) p.set("priceMax", priceInput);
    else p.delete("priceMax");
    p.delete("page");
    startTransition(() => router.push(`/events?${p.toString()}`));
  }

  const hasActiveFilters = currentFree || currentFeatured || currentDateRange || currentPriceMax || (currentSortBy && currentSortBy !== "date_asc");

  function clearAll() {
    const p = new URLSearchParams(params.toString());
    p.delete("free");
    p.delete("featured");
    p.delete("dateRange");
    p.delete("priceMax");
    p.delete("sort");
    p.delete("page");
    startTransition(() => router.push(`/events?${p.toString()}`));
  }

  return (
    <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700">🎛️ Dodatni filtri</span>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            Počisti vse
          </button>
        )}
      </div>

      {/* Date range */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          📅 Datum
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setParam("dateRange", null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !currentDateRange ? "bg-emerald-700 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            Kdaj koli
          </button>
          {DATE_RANGES.map((dr) => (
            <button
              key={dr.value}
              onClick={() => setParam("dateRange", currentDateRange === dr.value ? null : dr.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentDateRange === dr.value
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {dr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          💶 Cena
        </label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-stone-500">Do</span>
            <input
              type="number"
              min={0}
              max={1000}
              step={5}
              placeholder="Brez omejitve"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              onBlur={applyPriceMax}
              onKeyDown={(e) => e.key === "Enter" && applyPriceMax()}
              className="w-32 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm text-stone-500">€</span>
          </div>
          <button
            onClick={() => toggleBool("free", currentFree)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentFree ? "bg-green-600 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            🎁 Brezplačno
          </button>
        </div>
      </div>

      {/* Toggle filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => toggleBool("featured", currentFeatured)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            currentFeatured ? "bg-amber-500 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
          }`}
        >
          ⭐ Samo izpostavljeni
        </button>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
          ↕️ Razvrsti po
        </label>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setParam("sort", opt.value === "date_asc" ? null : opt.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (currentSortBy ?? "date_asc") === opt.value
                  ? "bg-stone-700 text-white"
                  : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

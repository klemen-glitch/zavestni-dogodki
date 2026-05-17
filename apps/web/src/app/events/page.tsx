export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { LocationFilter } from "@/components/LocationFilter";
import { EventFilters } from "@/components/EventFilters";
import { SponsoredStrip } from "@/components/SponsoredStrip";
import { NativeAdCard } from "@/components/NativeAdCard";
import { getAdForPosition } from "@/lib/ads";
import type { EventCategory } from "@conscious-slovenia/database";

export const metadata: Metadata = {
  title: "Vsi Zavestni Dogodki v Sloveniji 2026 — Joga, Meditacija, Retreati",
  description: "Poišči zavestne dogodke v Sloveniji: joga delavnice, meditacijski tečaji, breathwork, zvočne kopeli, kakao ceremonije in retreati. Filtriraj po mestu, kategoriji in datumu.",
  keywords: ["zavestni dogodki slovenija", "joga delavnice", "meditacija tečaj", "breathwork slovenija", "retreat slovenija", "zvočna kopel", "kakao ceremonija"],
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"}/events` },
  openGraph: {
    title: "Zavestni Dogodki v Sloveniji 2026 — Joga, Meditacija & Retreati",
    description: "Poišči joga delavnice, meditacijske tečaje, breathwork, zvočne kopeli in retreate v Sloveniji.",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"}/events`,
    type: "website",
    locale: "sl_SI",
    siteName: "Zavestni Dogodki",
  },
};

interface SearchParams {
  q?: string;
  category?: string;
  page?: string;
  featured?: string;
  city?: string;
  region?: string;
  free?: string;
  dateRange?: string;
  priceMax?: string;
  sort?: string;
}

function getDateRangeFilter(dateRange?: string): { gte?: Date; lte?: Date } | undefined {
  if (!dateRange) return undefined;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (dateRange) {
    case "today": {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { gte: now, lte: end };
    }
    case "week": {
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      return { gte: now, lte: end };
    }
    case "month": {
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      return { gte: now, lte: end };
    }
    case "weekend": {
      const day = now.getDay(); // 0=Sun,6=Sat
      const daysUntilSat = day <= 6 ? 6 - day : 0;
      const sat = new Date(now);
      sat.setDate(sat.getDate() + daysUntilSat);
      const sun = new Date(sat);
      sun.setDate(sun.getDate() + 1);
      sun.setHours(23, 59, 59, 999);
      return { gte: sat, lte: sun };
    }
    default:
      return undefined;
  }
}

function getSortOrder(sort?: string): { featured?: "asc" | "desc"; date?: "asc" | "desc"; viewCount?: "asc" | "desc"; price?: "asc" | "desc" }[] {
  switch (sort) {
    case "price_asc":
      return [{ featured: "desc" }, { price: "asc" }];
    case "price_desc":
      return [{ featured: "desc" }, { price: "desc" }];
    case "popular":
      return [{ featured: "desc" }, { viewCount: "desc" }];
    default:
      return [{ featured: "desc" }, { date: "asc" }];
  }
}

async function getFeatured() {
  return db.event.findMany({
    where: { status: "FEATURED", date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 6,
    include: { organizer: true, venue: true },
  });
}

async function getEvents(search: SearchParams) {
  const page = Math.max(1, Number(search.page ?? 1));
  const pageSize = 12;
  const now = new Date();
  const dateFilter = getDateRangeFilter(search.dateRange);

  const where = {
    status: { in: ["APPROVED", "FEATURED"] as ("APPROVED" | "FEATURED")[] },
    date: dateFilter ?? { gte: now },
    ...(search.category && { category: search.category as EventCategory }),
    ...(search.featured === "true" && { featured: true }),
    ...(search.free === "true" && { price: 0 }),
    ...(search.priceMax && { price: { lte: Number(search.priceMax) } }),
    ...(search.city && { venue: { city: search.city } }),
    ...(search.region && { venue: { region: search.region } }),
    ...(search.q && {
      OR: [
        { titleEn: { contains: search.q, mode: "insensitive" as const } },
        { titleSl: { contains: search.q, mode: "insensitive" as const } },
        { descriptionEn: { contains: search.q, mode: "insensitive" as const } },
        { descriptionSl: { contains: search.q, mode: "insensitive" as const } },
        { venueName: { contains: search.q, mode: "insensitive" as const } },
        { tags: { has: search.q.toLowerCase() } },
      ],
    }),
  };

  const orderBy = getSortOrder(search.sort);

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { organizer: true, venue: true },
    }),
    db.event.count({ where }),
  ]);

  return { events, total, page, pageSize, pages: Math.ceil(total / pageSize) };
}

// Count active filters for badge display
function countActiveFilters(params: SearchParams): number {
  let count = 0;
  if (params.city) count++;
  if (params.region) count++;
  if (params.free === "true") count++;
  if (params.featured === "true") count++;
  if (params.dateRange) count++;
  if (params.priceMax) count++;
  if (params.sort && params.sort !== "date_asc") count++;
  return count;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ events, total, page, pages }, featured] = await Promise.all([
    getEvents(params),
    params.page ? Promise.resolve([]) : getFeatured(),
  ]);
  const activeFilterCount = countActiveFilters(params);
  // Show sponsored strip only on page 1 with no active filters
  const showSponsored = !params.page && !params.q && !params.category && !params.city && !params.region && featured.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Zavestni dogodki</h1>
        <p className="text-stone-500">
          {total} dogodkov v Sloveniji
          {(params.city || params.region) && (
            <span className="ml-2 text-emerald-700 font-medium">
              {params.city ? `· ${params.city}` : `· ${params.region}`}
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {/* Search bar */}
        <Suspense>
          <SearchBar placeholder="Išči po naslovu, kraju, kategoriji..." />
        </Suspense>

        {/* Category filter */}
        <Suspense>
          <CategoryFilter current={params.category} />
        </Suspense>

        {/* Location filter (city + region) */}
        <Suspense>
          <LocationFilter
            currentCity={params.city}
            currentRegion={params.region}
          />
        </Suspense>

        {/* Additional filters (date, price, sort, etc.) */}
        <Suspense>
          <EventFilters
            currentFree={params.free === "true"}
            currentFeatured={params.featured === "true"}
            currentDateRange={params.dateRange}
            currentPriceMax={params.priceMax}
            currentSortBy={params.sort}
          />
        </Suspense>

        {/* Active filter summary */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
              {activeFilterCount} aktiven filter{activeFilterCount > 1 ? "i" : ""}
            </span>
            <a
              href="/events"
              className="text-stone-400 hover:text-stone-600 underline transition-colors"
            >
              Počisti vse filtre
            </a>
          </div>
        )}
      </div>

      {/* Sponsored featured strip — only on unfiltered page 1 */}
      {showSponsored && (
        <SponsoredStrip events={featured as Parameters<typeof SponsoredStrip>[0]["events"]} />
      )}

      {events.length === 0 ? (
        <div className="text-center py-24 text-stone-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">Ni najdenih dogodkov.</p>
          <p className="text-sm mt-2">Poskusite z drugimi iskalnimi pogoji.</p>
          <a href="/events" className="mt-4 inline-block text-emerald-700 hover:underline text-sm">
            Počisti vse filtre →
          </a>
        </div>
      ) : (
        <>
          {/* Events grid with native ads injected every 6 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.flatMap((e, idx) => {
              const cards = [
                <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />,
              ];
              // Insert a native ad after every 6th event card
              if ((idx + 1) % 6 === 0 && idx + 1 < events.length) {
                const ad = getAdForPosition(Math.floor((idx + 1) / 6) - 1);
                cards.push(<NativeAdCard key={`ad-${idx}`} ad={ad} />);
              }
              return cards;
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
                const sp = new URLSearchParams();
                if (params.q) sp.set("q", params.q);
                if (params.category) sp.set("category", params.category);
                if (params.city) sp.set("city", params.city);
                if (params.region) sp.set("region", params.region);
                if (params.free) sp.set("free", params.free);
                if (params.featured) sp.set("featured", params.featured);
                if (params.dateRange) sp.set("dateRange", params.dateRange);
                if (params.priceMax) sp.set("priceMax", params.priceMax);
                if (params.sort) sp.set("sort", params.sort);
                sp.set("page", String(p));
                return (
                  <a
                    key={p}
                    href={`/events?${sp.toString()}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-emerald-700 text-white"
                        : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          )}

          {/* "Become a partner" footer banner */}
          <div className="mt-12 rounded-2xl overflow-hidden border border-emerald-200">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-white font-bold text-lg leading-tight">Oglasite se na Zavestnih Dogodkih</p>
                <p className="text-emerald-100 text-sm mt-1">Dosezite zavestno skupnost po vsej Sloveniji — studio, center, blagovna znamka.</p>
              </div>
              <a
                href="mailto:klemen@zavestnidogodki.si?subject=Oglaševanje na Zavestnih Dogodkih"
                className="flex-shrink-0 bg-white text-emerald-800 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-50 transition-colors"
              >
                Postani partner →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

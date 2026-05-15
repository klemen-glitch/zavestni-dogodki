export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { LocationFilter } from "@/components/LocationFilter";
import { EventFilters } from "@/components/EventFilters";
import type { EventCategory } from "@conscious-slovenia/database";

export const metadata: Metadata = {
  title: "Dogodki",
  description: "Vsi zavestni dogodki v Sloveniji — joga, meditacija, breathwork in več.",
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
  const { events, total, page, pages } = await getEvents(params);
  const activeFilterCount = countActiveFilters(params);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e) => (
              <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />
            ))}
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
        </>
      )}
    </div>
  );
}

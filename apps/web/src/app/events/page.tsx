import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import type { EventCategory } from "@conscious-slovenia/database";

export const metadata: Metadata = {
  title: "Dogodki",
  description: "Vsi zavestni dogodki v Sloveniji — joga, meditacija, breathwork in več.",
};

interface SearchParams { q?: string; category?: string; page?: string; featured?: string }

async function getEvents(search: SearchParams) {
  const page = Math.max(1, Number(search.page ?? 1));
  const pageSize = 12;
  const now = new Date();

  const where = {
    status: { in: ["APPROVED", "FEATURED"] as const },
    date: { gte: now },
    ...(search.category && { category: search.category as EventCategory }),
    ...(search.featured === "true" && { featured: true }),
    ...(search.q && {
      OR: [
        { titleEn: { contains: search.q, mode: "insensitive" as const } },
        { titleSl: { contains: search.q, mode: "insensitive" as const } },
        { descriptionEn: { contains: search.q, mode: "insensitive" as const } },
        { venueName: { contains: search.q, mode: "insensitive" as const } },
        { tags: { has: search.q.toLowerCase() } },
      ],
    }),
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: [{ featured: "desc" }, { date: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { organizer: true, venue: true },
    }),
    db.event.count({ where }),
  ]);

  return { events, total, page, pageSize, pages: Math.ceil(total / pageSize) };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { events, total, page, pages } = await getEvents(params);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Zavestni dogodki</h1>
        <p className="text-stone-500">{total} dogodkov v Sloveniji</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <Suspense>
          <SearchBar placeholder="Išči po naslovu, kraju, kategoriji..." />
        </Suspense>
        <Suspense>
          <CategoryFilter current={params.category} />
        </Suspense>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-24 text-stone-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">Ni najdenih dogodkov.</p>
          <p className="text-sm mt-2">Poskusite z drugimi iskalnimi pogoji.</p>
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
                sp.set("page", String(p));
                return (
                  <a key={p} href={`/events?${sp.toString()}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-emerald-700 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"}`}>
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

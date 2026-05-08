export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatDate, CATEGORY_EMOJI, CATEGORY_LABEL } from "@/lib/utils";
import { AdminEventsTable } from "@/components/admin/EventsTable";

export const metadata: Metadata = { title: "Dogodki" };

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status as "PENDING_REVIEW" | "APPROVED" | "FEATURED" | "REJECTED") ?? "PENDING_REVIEW";
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 20;

  const where = { status } as const;

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: [{ aiConfidence: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { organizer: true },
    }),
    db.event.count({ where }),
  ]);

  const counts = await db.event.groupBy({
    by: ["status"],
    _count: true,
  });

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Pregled dogodkov</h1>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "PENDING_REVIEW", label: "V pregledu", color: "amber" },
          { key: "APPROVED", label: "Odobreni", color: "emerald" },
          { key: "FEATURED", label: "Izpostavljeni", color: "violet" },
          { key: "REJECTED", label: "Zavrnjeni", color: "red" },
        ].map((s) => (
          <a key={s.key} href={`/admin/events?status=${s.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === s.key ? "bg-stone-800 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}>
            {s.label}
            {countMap[s.key] != null && (
              <span className="ml-2 bg-stone-200 text-stone-700 text-xs px-1.5 py-0.5 rounded-full">
                {countMap[s.key]}
              </span>
            )}
          </a>
        ))}
      </div>

      <AdminEventsTable events={events} total={total} page={page} pageSize={pageSize} currentStatus={status} />
    </div>
  );
}

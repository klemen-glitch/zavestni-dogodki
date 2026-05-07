import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Facilitatorji",
  description: "Spoznajte facilitatorje in učitelje zavestnih dogodkov v Sloveniji.",
};

export default async function OrganizersPage() {
  const organizers = await db.organizer.findMany({
    where: { events: { some: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } } } },
    include: { _count: { select: { events: true } } },
    orderBy: [{ tier: "asc" }, { rating: "desc" }],
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Facilitatorji</h1>
        <p className="text-stone-500">Učitelji in organizatorji zavestnih dogodkov po vsej Sloveniji</p>
      </div>

      {organizers.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-5xl mb-4">🧘</p>
          <p>Kmalu bo dodanih več facilitatorjev.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {organizers.map((org) => (
            <Link key={org.id} href={`/organizers/${org.id}`}
              className="bg-white rounded-2xl border border-stone-100 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all text-center group">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-50 mx-auto mb-4 flex items-center justify-center">
                {org.avatarUrl
                  ? <Image src={org.avatarUrl} alt={org.name} width={64} height={64} className="object-cover" />
                  : <span className="text-2xl">🧘</span>
                }
              </div>
              <h3 className="font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors">{org.name}</h3>
              {org.tier !== "FREE" && (
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${org.tier === "PARTNER" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {org.tier === "PARTNER" ? "⭐ Partner" : "✓ Premium"}
                </span>
              )}
              <p className="text-stone-400 text-xs mt-2">{org._count.events} dogodkov</p>
              {org.instagram && (
                <p className="text-emerald-600 text-xs mt-1">{org.instagram}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

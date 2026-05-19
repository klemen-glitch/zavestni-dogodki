export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: { absolute: "Yoga Učitelji & Facilitatorji v Sloveniji — Zavestni Dogodki" },
  description: "Spoznajte verificirane yoga učitelje, meditacijske vodiče in wellness facilitatorje v Sloveniji. Prihajajoči dogodki, ocene in kontaktni podatki.",
  keywords: ["yoga učitelj slovenija", "meditacijski vodič", "facilitator breathwork", "retreat vodič slovenija", "wellness facilitator"],
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"}/organizers`,
  },
  openGraph: {
    title: "Yoga Učitelji & Facilitatorji v Sloveniji",
    description: "Verificirani yoga učitelji, meditacijski vodiči in wellness facilitatorji v Sloveniji z prihajajoči dogodki.",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"}/organizers`,
    type: "website",
    locale: "sl_SI",
    siteName: "Zavestni Dogodki",
  },
};

export default async function OrganizersPage() {
  const organizers = await db.organizer.findMany({
    where: { events: { some: { status: { in: ["APPROVED", "FEATURED"] } } } },
    include: {
      _count: { select: { events: true } },
      events: {
        where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } },
        orderBy: { date: "asc" },
        take: 1,
        select: { date: true },
      },
    },
    orderBy: [{ tier: "asc" }, { rating: "desc" }],
    take: 50,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Facilitatorji", item: `${appUrl}/organizers` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-6">
        <Link href="/" className="hover:text-stone-600">Domov</Link>
        <span>/</span>
        <span className="text-stone-700">Facilitatorji</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Yoga Učitelji &amp; Facilitatorji v Sloveniji</h1>
        <p className="text-stone-500">Verificirani učitelji in organizatorji zavestnih dogodkov po vsej Sloveniji</p>
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
                  ? <Image src={org.avatarUrl} alt={org.name} width={64} height={64} className="object-cover [object-position:50%_20%]" />
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
    </>
  );
}

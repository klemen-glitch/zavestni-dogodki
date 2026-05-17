export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { CATEGORY_EMOJI, CATEGORY_LABEL, formatDate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const org = await db.organizer.findUnique({ where: { id } });
  if (!org) return { title: "Facilitator ni najden" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  return {
    title: { absolute: `${org.name} — Facilitator & Yoga Učitelj v Sloveniji | Zavestni Dogodki` },
    description: org.bio ?? `Prihajajoči zavestni dogodki s facilitatorjem ${org.name} v Sloveniji — joga, meditacija, breathwork in retreati.`,
    alternates: { canonical: `${appUrl}/organizers/${id}` },
    openGraph: {
      title: `${org.name} — Facilitator v Sloveniji`,
      description: org.bio ?? `Prihajajoči zavestni dogodki s facilitatorjem ${org.name} v Sloveniji.`,
      url: `${appUrl}/organizers/${id}`,
      type: "profile",
      locale: "sl_SI",
      siteName: "Zavestni Dogodki",
      images: org.avatarUrl ? [{ url: org.avatarUrl, alt: `${org.name} — facilitator` }] : [],
    },
  };
}

export default async function OrganizerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  const [organizer, events] = await Promise.all([
    db.organizer.findUnique({
      where: { id },
      include: { _count: { select: { events: true } } },
    }),
    db.event.findMany({
      where: {
        organizerId: id,
        status: { in: ["APPROVED", "FEATURED"] },
        date: { gte: new Date() },
      },
      orderBy: { date: "asc" },
      include: { venue: true, organizer: true },
    }),
  ]);

  if (!organizer) notFound();

  const sameAsLinks = [
    ...(organizer.website ? [organizer.website] : []),
    ...(organizer.instagram ? [`https://instagram.com/${organizer.instagram.replace("@", "")}`] : []),
    ...(organizer.facebookUrl ? [organizer.facebookUrl] : []),
  ];

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: organizer.name,
    url: `${appUrl}/organizers/${id}`,
    ...(organizer.avatarUrl && { image: organizer.avatarUrl }),
    ...(organizer.bio && { description: organizer.bio }),
    ...(sameAsLinks.length > 0 && { sameAs: sameAsLinks }),
    jobTitle: "Wellness Facilitator",
    knowsAbout: ["joga", "meditacija", "breathwork", "zavestne prakse"],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Facilitatorji", item: `${appUrl}/organizers` },
      { "@type": "ListItem", position: 3, name: organizer.name, item: `${appUrl}/organizers/${id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/organizers" className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-700 text-sm mb-8">
        ← Vsi facilitatorji
      </Link>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-10 items-start">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-emerald-50 flex-shrink-0 flex items-center justify-center">
          {organizer.avatarUrl
            ? <Image src={organizer.avatarUrl} alt={organizer.name} width={96} height={96} className="object-cover object-top" />
            : <span className="text-4xl">🧘</span>
          }
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-stone-800">{organizer.name}</h1>
            {organizer.verified && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Verificiran</span>
            )}
            {organizer.tier === "PREMIUM" && (
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Premium</span>
            )}
            {organizer.tier === "PARTNER" && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⭐ Partner</span>
            )}
          </div>

          {organizer.bio && (
            <p className="text-stone-600 text-sm leading-relaxed mb-3">{organizer.bio}</p>
          )}

          {/* Contact links */}
          <div className="flex flex-wrap gap-3 text-sm">
            {organizer.instagram && (
              <a href={`https://instagram.com/${organizer.instagram.replace("@", "")}`} target="_blank" rel="noopener"
                className="flex items-center gap-1 text-rose-500 hover:text-rose-600 transition-colors">
                📸 {organizer.instagram}
              </a>
            )}
            {organizer.website && (
              <a href={organizer.website} target="_blank" rel="noopener"
                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors">
                🌐 Spletna stran
              </a>
            )}
            {organizer.email && (
              <a href={`mailto:${organizer.email}`}
                className="flex items-center gap-1 text-stone-500 hover:text-stone-700 transition-colors">
                ✉️ {organizer.email}
              </a>
            )}
            {organizer.facebookUrl && (
              <a href={organizer.facebookUrl} target="_blank" rel="noopener"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors">
                📘 Facebook
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex sm:flex-col gap-4 sm:gap-2 text-center sm:text-right flex-shrink-0">
          <div>
            <p className="text-2xl font-bold text-stone-800">{organizer._count.events}</p>
            <p className="text-xs text-stone-400">skupaj</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-700">{events.length}</p>
            <p className="text-xs text-stone-400">prihajajoči</p>
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      <section>
        <h2 className="text-xl font-bold text-stone-800 mb-4">
          Prihajajoči dogodki {events.length > 0 && <span className="text-stone-400 font-normal text-base">({events.length})</span>}
        </h2>

        {events.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-2xl">
            <p className="text-stone-400 text-sm">Trenutno ni prihajajoči dogodkov s tem facilitatorjem.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {events.map((e) => (
              <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />
            ))}
          </div>
        )}
      </section>
    </div>
    </>
  );
}

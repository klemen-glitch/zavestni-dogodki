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
  const description = org.richBio
    ? org.richBio.split(/\n\n+/)[0]?.slice(0, 160) ?? org.bio ?? ""
    : org.bio ?? `Prihajajoči zavestni dogodki s facilitatorjem ${org.name} v Sloveniji — joga, meditacija, breathwork in retreati.`;
  return {
    title: { absolute: `${org.name} — Facilitator & Wellness Učitelj v Sloveniji | Zavestni Dogodki` },
    description,
    alternates: { canonical: `${appUrl}/organizers/${id}` },
    openGraph: {
      title: `${org.name} — Facilitator v Sloveniji`,
      description,
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

  const bioText = organizer.richBio ?? organizer.bio ?? "";

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: organizer.name,
    url: `${appUrl}/organizers/${id}`,
    ...(organizer.avatarUrl && { image: organizer.avatarUrl }),
    ...(bioText && { description: bioText.slice(0, 500) }),
    ...(sameAsLinks.length > 0 && { sameAs: sameAsLinks }),
    jobTitle: "Wellness Facilitator",
    knowsAbout: ["joga", "meditacija", "breathwork", "zavestne prakse", "Slovenija"],
    mainEntityOfPage: { "@type": "WebPage", "@id": `${appUrl}/organizers/${id}` },
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

      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden mb-8">
        {/* Header strip */}
        <div className="px-6 pt-6 pb-5 flex flex-col sm:flex-row gap-5 items-start border-b border-stone-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/30">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-emerald-50 flex-shrink-0 flex items-center justify-center shadow-sm">
            {organizer.avatarUrl
              ? <Image src={organizer.avatarUrl} alt={organizer.name} width={96} height={96} className="object-cover [object-position:50%_20%]" />
              : <span className="text-4xl">🧘</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-stone-800">{organizer.name}</h1>
              {organizer.verified && (
                <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">✓ Verificiran</span>
              )}
              {organizer.tier === "PREMIUM" && (
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Premium</span>
              )}
              {organizer.tier === "PARTNER" && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⭐ Partner</span>
              )}
            </div>

            <p className="text-sm text-emerald-700 font-medium mb-3">Wellness facilitator · Slovenija</p>

            {/* Stats inline */}
            <div className="flex gap-5 text-sm">
              <div>
                <span className="font-bold text-stone-800">{organizer._count.events}</span>
                <span className="text-stone-400 ml-1">skupaj dogodkov</span>
              </div>
              <div>
                <span className="font-bold text-emerald-700">{events.length}</span>
                <span className="text-stone-400 ml-1">prihajajoči</span>
              </div>
              {organizer.rating > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-xs">★</span>
                  <span className="font-bold text-stone-800">{organizer.rating.toFixed(1)}</span>
                  {organizer.reviewCount > 0 && <span className="text-stone-400">({organizer.reviewCount})</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rich biography */}
        {bioText && (
          <div className="px-6 py-5 border-b border-stone-50 space-y-3">
            {bioText.split(/\n\n+/).filter(Boolean).map((para, i) => (
              <p key={i} className="text-stone-600 text-sm leading-relaxed">
                {para.trim()}
              </p>
            ))}
          </div>
        )}

        {/* Contact & social links */}
        <div className="px-6 py-4 flex flex-wrap gap-3">
          {organizer.instagram && (
            <a href={`https://instagram.com/${organizer.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors px-3 py-1.5 rounded-lg">
              📸 {organizer.instagram.startsWith("@") ? organizer.instagram : `@${organizer.instagram}`}
            </a>
          )}
          {organizer.website && (
            <a href={organizer.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors px-3 py-1.5 rounded-lg">
              🌐 Spletna stran
            </a>
          )}
          {organizer.facebookUrl && (
            <a href={organizer.facebookUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors px-3 py-1.5 rounded-lg">
              📘 Facebook
            </a>
          )}
          {organizer.email && (
            <a href={`mailto:${organizer.email}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors px-3 py-1.5 rounded-lg">
              ✉️ {organizer.email}
            </a>
          )}
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

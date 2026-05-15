export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getEnrichedContent } from "@/lib/event-enrichment";
import { ShareButtons } from "@/components/ShareButtons";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { EventCard } from "@/components/EventCard";
import { EventLocationMap } from "@/components/EventLocationMap";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  CATEGORY_HEX,
  formatDate,
  formatTime,
  formatPrice,
} from "@/lib/utils";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getEvent(slug: string) {
  const event = await db.event.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    include: { organizer: true, venue: true },
  });
  if (event) {
    db.event.update({ where: { id: event.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  }
  return event;
}

async function getRelated(category: string, currentId: string) {
  return db.event.findMany({
    where: {
      category: category as never,
      id: { not: currentId },
      status: { in: ["APPROVED", "FEATURED"] },
      date: { gte: new Date() },
    },
    take: 3,
    orderBy: { date: "asc" },
    include: { organizer: true, venue: true },
  });
}

function toGCalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Dogodek ni najden" };
  const title = event.titleSl ?? event.titleEn;
  const description =
    event.descriptionSl?.slice(0, 160) ?? event.shortDescEn ?? event.descriptionEn.slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: event.imageUrl ? [{ url: event.imageUrl }] : [],
      type: "article",
    },
  };
}

// ── Helper components ─────────────────────────────────────────────────────────

function InfoPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-stone-100">
      <span className="text-2xl mt-0.5">{icon}</span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-0.5">{label}</p>
        <p className="font-semibold text-stone-800 text-sm leading-snug">{value}</p>
      </div>
    </div>
  );
}

function BenefitCard({
  title,
  description,
  index,
  color,
}: {
  title: string;
  description: string;
  index: number;
  color: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5"
        style={{ backgroundColor: color }}
      >
        {index + 1}
      </div>
      <div>
        <p className="font-semibold text-stone-800 mb-1">{title}</p>
        <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, relatedEvents] = await Promise.all([
    getEvent(slug),
    getEvent(slug).then((e) => (e ? getRelated(e.category, e.id) : [])),
  ]);

  if (!event) notFound();

  const enriched = await getEnrichedContent(event);

  const emoji = CATEGORY_EMOJI[event.category] ?? "🌸";
  const label = CATEGORY_LABEL[event.category] ?? "Dogodek";
  const [catColor, catDark] = CATEGORY_HEX[event.category] ?? ["#2d6a4f", "#064e3b"];
  const time = formatTime(event.date);
  const endTime = event.endDate ? formatTime(event.endDate) : null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const eventUrl = `${appUrl}/events/${event.slug ?? event.id}`;

  const endForCal = event.endDate ?? new Date(event.date.getTime() + 2 * 60 * 60 * 1000);
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.titleEn
  )}&dates=${toGCalDate(event.date)}/${toGCalDate(endForCal)}&details=${encodeURIComponent(
    (event.shortDescEn ?? event.descriptionEn).slice(0, 400)
  )}&location=${encodeURIComponent(event.venue?.address ?? event.venueName ?? "")}`;

  const locationName = event.venue?.name ?? event.venueName ?? "Slovenija";
  const locationCity = event.venue?.city ?? "";
  const locationRegion = event.venue?.region ?? "";
  const locationAddress = event.venue?.address ?? "";
  const hasCoords = event.venue?.lat && event.venue?.lng;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.titleEn,
    startDate: event.date.toISOString(),
    endDate: endForCal.toISOString(),
    description: event.shortDescEn ?? event.descriptionEn.slice(0, 300),
    url: eventUrl,
    ...(event.imageUrl && { image: event.imageUrl }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: locationName,
      ...(event.venue?.address && {
        address: { "@type": "PostalAddress", streetAddress: event.venue.address, addressCountry: "SI" },
      }),
    },
    ...(event.organizer && { organizer: { "@type": "Person", name: event.organizer.name } }),
    ...(event.price !== null && {
      offers: {
        "@type": "Offer",
        price: String(event.price),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: event.sourceUrl ?? eventUrl,
      },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[52vh] min-h-[360px] max-h-[520px] overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.titleSl ?? event.titleEn}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${catColor}, ${catDark})` }} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/30 to-transparent" />
        {/* Category gradient accent */}
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `linear-gradient(to right, transparent 40%, ${catColor}66 100%)` }}
        />

        {/* Back link */}
        <div className="absolute top-6 left-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
          >
            ← Vsi dogodki
          </Link>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: catColor }}
            >
              {emoji} {label}
            </span>
            {event.featured && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-amber-900">
                ⭐ Izpostavljeno
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 drop-shadow-lg">
            {event.titleSl ?? event.titleEn}
          </h1>
          <p className="text-white/80 text-lg font-medium">
            📅 {formatDate(event.date)} {time && `· ${time}`}
            {endTime && ` – ${endTime}`}
            &nbsp;&nbsp;📍 {locationName}{locationCity ? `, ${locationCity}` : ""}
          </p>
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Main content ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-12">

            {/* About the event */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: catColor }} />
                <h2 className="text-xl font-bold text-stone-800">O dogodku</h2>
              </div>
              <div className="space-y-4">
                {enriched.intro.map((para, i) => (
                  <p key={i} className="text-stone-600 text-base leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </section>

            {/* What to expect */}
            <section className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
              <h2 className="text-lg font-bold text-stone-800 mb-4">🎯 Kaj te čaka</h2>
              <ul className="space-y-3">
                {enriched.whatToExpect.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                      style={{ backgroundColor: catColor }}
                    >
                      ✓
                    </span>
                    <span className="text-stone-700 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Facilitator */}
            {event.organizer && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: catColor }} />
                  <h2 className="text-xl font-bold text-stone-800">Facilitator</h2>
                </div>
                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-0">
                    {event.organizer.avatarUrl && (
                      <div className="relative sm:w-44 h-44 flex-shrink-0">
                        <Image
                          src={event.organizer.avatarUrl}
                          alt={event.organizer.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-stone-800">{event.organizer.name}</h3>
                          {event.organizer.verified && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                              ✓ Verificiran facilitator
                            </span>
                          )}
                        </div>
                        {event.organizer.rating && (
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                            <span className="text-amber-500 text-sm">★</span>
                            <span className="text-sm font-semibold text-amber-700">
                              {event.organizer.rating.toFixed(1)}
                            </span>
                            {event.organizer.reviewCount && (
                              <span className="text-xs text-amber-600">({event.organizer.reviewCount})</span>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-stone-600 text-sm leading-relaxed mb-4">{enriched.facilitatorBio}</p>
                      <blockquote className="border-l-2 pl-4 italic text-stone-500 text-sm" style={{ borderColor: catColor }}>
                        {enriched.facilitatorFact}
                      </blockquote>
                      <div className="flex gap-3 mt-4">
                        {event.organizer.instagram && (
                          <a
                            href={`https://instagram.com/${event.organizer.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: "#e1306c" }}
                          >
                            Instagram {event.organizer.instagram}
                          </a>
                        )}
                        {event.organizer.website && (
                          <a
                            href={event.organizer.website}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-colors"
                          >
                            🌐 Spletna stran
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Technique explanation */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: catColor }} />
                <h2 className="text-xl font-bold text-stone-800">{enriched.techniqueTitle}</h2>
              </div>
              <p className="text-stone-600 text-base leading-relaxed mb-6">{enriched.techniqueDescription}</p>

              {/* Benefits */}
              <h3 className="text-base font-bold text-stone-700 mb-4">✨ Dokazani učinki in koristi</h3>
              <div className="space-y-5">
                {enriched.benefits.map((b, i) => (
                  <BenefitCard key={i} title={b.title} description={b.description} index={i} color={catColor} />
                ))}
              </div>
            </section>

            {/* Research notes */}
            <section className="rounded-2xl p-6 border-l-4" style={{ borderColor: catColor, backgroundColor: `${catColor}08` }}>
              <h3 className="font-bold text-stone-800 mb-3">🔬 Kaj pravita znanost in raziskave</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{enriched.researchNotes}</p>
            </section>

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/events?q=${tag}`}
                    className="text-xs px-3 py-1 rounded-full font-medium transition-colors"
                    style={{ backgroundColor: `${catColor}15`, color: catColor }}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Share */}
            <ShareButtons title={event.titleSl ?? event.titleEn} url={eventUrl} />
          </div>

          {/* ── RIGHT: Sticky sidebar ──────────────────────────────────── */}
          <div className="space-y-4">
            <div className="lg:sticky lg:top-6 space-y-4">

              {/* Register / main CTA */}
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="p-1" style={{ background: `linear-gradient(135deg, ${catColor}, ${catDark})` }}>
                  <div className="bg-white rounded-xl p-5">
                    <p className="text-2xl font-extrabold text-stone-800 mb-1">
                      {formatPrice(event.price, event.priceNote)}
                    </p>
                    <p className="text-xs text-stone-400 mb-4">na osebo · enkratni vnos</p>

                    {event.sourceUrl ? (
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center text-white font-bold py-3.5 rounded-xl text-sm transition-opacity hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${catColor}, ${catDark})` }}
                      >
                        📘 Prijavi se na Facebooku →
                      </a>
                    ) : (
                      <div
                        className="block w-full text-center text-white font-bold py-3.5 rounded-xl text-sm opacity-70 cursor-not-allowed"
                        style={{ backgroundColor: catColor }}
                      >
                        Prijava kmalu →
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <a
                        href={gcalUrl}
                        target="_blank"
                        rel="noopener"
                        className="flex-1 text-center text-xs font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 py-2.5 rounded-lg transition-colors"
                      >
                        📅 Google Kol.
                      </a>
                      <a
                        href={`/api/events/${event.slug ?? event.id}/ical`}
                        className="flex-1 text-center text-xs font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 py-2.5 rounded-lg transition-colors"
                      >
                        📆 .ics
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info pills */}
              <InfoPill
                icon="📅"
                label="Datum"
                value={`${formatDate(event.date, { weekday: "long", day: "numeric", month: "long" })}${time ? ` · ${time}` : ""}${endTime ? ` – ${endTime}` : ""}`}
              />
              <InfoPill icon="📍" label="Lokacija" value={`${locationName}${locationCity ? `, ${locationCity}` : ""}${locationRegion ? ` · ${locationRegion}` : ""}`} />
              {locationAddress && (
                <InfoPill icon="🗺️" label="Naslov" value={locationAddress} />
              )}
              <InfoPill icon="🏷️" label="Kategorija" value={`${emoji} ${label}`} />
              {event.organizer && (
                <InfoPill icon="👤" label="Facilitator" value={event.organizer.name} />
              )}

              {/* Source link */}
              {event.sourceUrl && (
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <span className="text-2xl">📘</span>
                  <div>
                    <p className="font-semibold text-blue-800 text-sm">Facebook Dogodek</p>
                    <p className="text-xs text-blue-600">Odpri originalni vir</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── LOCATION SECTION ─────────────────────────────────────────────── */}
        <section className="mt-16">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: catColor }} />
            <h2 className="text-xl font-bold text-stone-800">Lokacija in kako priti</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Location context */}
            <div
              className="md:col-span-1 rounded-2xl p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${catColor}, ${catDark})` }}
            >
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-xl font-bold mb-1">{locationCity || locationName}</h3>
              {locationRegion && <p className="text-white/70 text-sm mb-3">{locationRegion}, Slovenija</p>}
              <p className="text-white/90 text-sm leading-relaxed">{enriched.locationContext}</p>
              {locationAddress && (
                <p className="mt-3 text-white/70 text-xs">🗺️ {locationAddress}</p>
              )}
            </div>

            {/* Map */}
            <div className="md:col-span-2">
              {hasCoords ? (
                <EventLocationMap
                  lat={event.venue!.lat!}
                  lng={event.venue!.lng!}
                  venueName={locationName}
                  city={locationCity}
                />
              ) : (
                <div className="h-full min-h-[280px] rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-sm">Podrobnejša lokacija bo kmalu na voljo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── RELATED EVENTS ────────────────────────────────────────────────── */}
        {relatedEvents.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-800">Podobni dogodki {emoji}</h2>
              <Link href={`/events?category=${event.category}`} className="text-sm text-emerald-700 hover:underline font-medium">
                Vsi {label.toLowerCase()} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((e) => (
                <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />
              ))}
            </div>
          </section>
        )}

        {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
        <section className="mt-16">
          <NewsletterSignup compact />
        </section>
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getEnrichedContent } from "@/lib/event-enrichment";
import { ShareButtons } from "@/components/ShareButtons";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SubscribeSection } from "@/components/subscribe/SubscribeSection";
import { EventCard } from "@/components/EventCard";
import { EventLocationMap } from "@/components/EventLocationMap";
import { EventCTALink } from "@/components/EventCTALink";
import { BLOG_POSTS } from "@/content/blog-posts";
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

  const titleSl = event.titleSl ?? event.titleEn;
  const city = event.venue?.city ?? event.venueName ?? "Slovenija";
  const categoryLabel = CATEGORY_LABEL[event.category] ?? "Dogodek";
  const year = event.date.getFullYear();

  // SEO title: [Event Name] — [Category] v [City] [Year] (50-60 chars ideal)
  const seoTitle = `${titleSl} — ${categoryLabel} v ${city} ${year}`;

  // Meta description: date + location + short hook + CTA (120-160 chars)
  const formattedDate = formatDate(event.date, { day: "numeric", month: "long" });
  const shortDesc = event.shortDescEn ?? event.descriptionEn.slice(0, 80);
  const metaDesc = `${categoryLabel} v ${city}, ${formattedDate}. ${shortDesc.slice(0, 100)}. Oglej si podrobnosti in se prijavi!`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const canonicalUrl = `${appUrl}/events/${event.slug ?? event.id}`;

  return {
    title: seoTitle,
    description: metaDesc.slice(0, 160),
    keywords: [
      titleSl,
      categoryLabel,
      `${categoryLabel} ${city}`,
      `${categoryLabel} slovenija`,
      city,
      "zavestni dogodki",
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seoTitle,
      description: metaDesc.slice(0, 160),
      url: canonicalUrl,
      type: "article",
      locale: "sl_SI",
      siteName: "Zavestni Dogodki",
      images: event.imageUrl
        ? [{ url: event.imageUrl, width: 1200, height: 630, alt: titleSl }]
        : [],
      publishedTime: event.createdAt?.toISOString(),
      section: categoryLabel,
      tags: event.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: metaDesc.slice(0, 160),
      images: event.imageUrl ? [event.imageUrl] : [],
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
    name: event.titleSl ?? event.titleEn,
    startDate: event.date.toISOString(),
    endDate: endForCal.toISOString(),
    description: event.shortDescEn ?? event.descriptionEn.slice(0, 300),
    url: eventUrl,
    ...(event.imageUrl && { image: [event.imageUrl] }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "sl",
    location: {
      "@type": "Place",
      name: locationName,
      address: {
        "@type": "PostalAddress",
        ...(event.venue?.address && { streetAddress: event.venue.address }),
        ...(locationCity && { addressLocality: locationCity }),
        ...(locationRegion && { addressRegion: locationRegion }),
        addressCountry: "SI",
      },
      ...(hasCoords && { geo: { "@type": "GeoCoordinates", latitude: event.venue!.lat, longitude: event.venue!.lng } }),
    },
    organizer: event.organizer
      ? { "@type": "Person", name: event.organizer.name, ...(event.organizer.website && { url: event.organizer.website }) }
      : { "@type": "Organization", name: "Zavestni Dogodki", url: appUrl },
    ...(event.price !== null && {
      offers: {
        "@type": "Offer",
        price: String(event.price),
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        validFrom: (event.createdAt ?? new Date()).toISOString(),
        url: event.sourceUrl ?? eventUrl,
      },
    }),
    ...(event.tags.length > 0 && { keywords: event.tags.join(", ") }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Dogodki", item: `${appUrl}/events` },
      { "@type": "ListItem", position: 3, name: label, item: `${appUrl}/categories/${event.category.toLowerCase()}` },
      { "@type": "ListItem", position: 4, name: event.titleSl ?? event.titleEn, item: eventUrl },
    ],
  };

  const personSchema = event.organizer
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: event.organizer.name,
        url: `${appUrl}/organizers/${event.organizer.id}`,
        ...(event.organizer.avatarUrl && { image: event.organizer.avatarUrl }),
        description: event.organizer.richBio ?? event.organizer.bio ?? undefined,
        jobTitle: `${label} Facilitator`,
        knowsAbout: [label, "zavestne prakse", "wellness", "Slovenija"],
        sameAs: [
          ...(event.organizer.website ? [event.organizer.website] : []),
          ...(event.organizer.instagram ? [`https://instagram.com/${event.organizer.instagram.replace("@", "")}`] : []),
          ...(event.organizer.facebookUrl ? [event.organizer.facebookUrl] : []),
        ],
        worksFor: { "@type": "Organization", name: "Zavestni Dogodki", url: appUrl },
      }
    : null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Kaj bom izkusil/a na "${event.titleSl ?? event.titleEn}"?`,
        acceptedAnswer: { "@type": "Answer", text: enriched.whatToExpect.join(" ") },
      },
      ...enriched.benefits.slice(0, 3).map((b: { title: string; description: string }) => ({
        "@type": "Question",
        name: b.title,
        acceptedAnswer: { "@type": "Answer", text: b.description },
      })),
      {
        "@type": "Question",
        name: `Kje poteka "${event.titleSl ?? event.titleEn}"?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Dogodek poteka v ${locationName}${locationCity ? `, ${locationCity}` : ""}${locationAddress ? `, ${locationAddress}` : ""}, Slovenija.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {personSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      )}

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      {event.imageUrl ? (
        /* Photo hero: real photo as atmospheric background, text prominently layered */
        <div className="relative w-full h-[52vh] min-h-[380px] max-h-[540px] overflow-hidden">
          <Image
            src={event.imageUrl}
            alt={event.titleSl ?? event.titleEn}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/92 via-stone-900/55 to-stone-900/10" />

          <div className="absolute top-6 left-6">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
            >
              ← Vsi dogodki
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 max-w-5xl">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: catColor }}
              >
                {label}
              </span>
              {event.featured && (
                <span className="text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white">
                  Izpostavljeno
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight mb-3 drop-shadow">
              {event.titleSl ?? event.titleEn}
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-4 max-w-2xl">
              {(event.shortDescEn ?? event.descriptionEn).slice(0, 200)}
              {(event.shortDescEn ?? event.descriptionEn).length > 200 ? "…" : ""}
            </p>
            <p className="text-white/55 text-xs font-medium uppercase tracking-widest">
              {formatDate(event.date, { weekday: "short", day: "numeric", month: "long" })}
              {time ? ` · ${time}` : ""}
              {endTime ? ` – ${endTime}` : ""}
              {(locationName || locationCity) && ` · ${locationName}${locationCity ? `, ${locationCity}` : ""}`}
            </p>
          </div>
        </div>
      ) : (
        /* Editorial hero: cream background, serif title, text-first — no AI photo */
        <div className="relative w-full overflow-hidden border-b border-stone-200/60" style={{ backgroundColor: "#faf7f2" }}>
          {/* Left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: catColor }} />
          {/* Botanical decorative circles */}
          <svg
            className="absolute top-0 right-0 w-[45%] h-full pointer-events-none"
            viewBox="0 0 400 400"
            fill="none"
            style={{ opacity: 0.05 }}
            aria-hidden="true"
          >
            <circle cx="360" cy="120" r="300" stroke={catColor} strokeWidth="1" />
            <circle cx="360" cy="120" r="200" stroke={catColor} strokeWidth="0.8" />
            <circle cx="360" cy="120" r="110" stroke={catColor} strokeWidth="0.6" />
            <circle cx="360" cy="120" r="50" stroke={catColor} strokeWidth="0.5" />
          </svg>

          <div className="max-w-5xl mx-auto px-8 md:px-12 pt-14 pb-12 relative">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-600 text-sm mb-7 transition-colors"
            >
              ← Vsi dogodki
            </Link>

            <div className="flex items-center gap-2 mb-5">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
                style={{ backgroundColor: catColor }}
              >
                {label}
              </span>
              {event.featured && (
                <span className="text-[10px] font-medium uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-500">
                  Izpostavljeno
                </span>
              )}
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-stone-800 leading-tight mb-5 max-w-3xl">
              {event.titleSl ?? event.titleEn}
            </h1>

            <p className="text-stone-500 text-lg leading-relaxed mb-7 max-w-2xl">
              {(event.shortDescEn ?? event.descriptionEn).slice(0, 220)}
              {(event.shortDescEn ?? event.descriptionEn).length > 220 ? "…" : ""}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium uppercase tracking-widest text-stone-400">
              <span>
                {formatDate(event.date, { weekday: "long", day: "numeric", month: "long" })}
                {time ? ` · ${time}` : ""}
                {endTime ? ` – ${endTime}` : ""}
              </span>
              <span className="text-stone-300">|</span>
              <span>{locationName}{locationCity ? `, ${locationCity}` : ""}</span>
              <span className="text-stone-300">|</span>
              <span style={{ color: catColor }}>{formatPrice(event.price, event.priceNote)}</span>
            </div>
          </div>
        </div>
      )}

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
                  <div key={i}>
                    <p className="text-stone-600 text-base leading-relaxed">{para}</p>
                    {enriched.sectionImages?.[i] && (
                      <div className="relative mt-5 mb-2 w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
                        <Image
                          src={enriched.sectionImages[i]}
                          alt={`${event.titleSl ?? event.titleEn} — ${label}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 672px"
                        />
                      </div>
                    )}
                  </div>
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

            {/* Facebook Event Link — prominent section */}
            {event.sourceUrl && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: catColor }} />
                  <h2 className="text-xl font-bold text-stone-800">Originalni Facebook Dogodek</h2>
                </div>
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4 px-6 py-5" style={{ background: "linear-gradient(135deg, #1877f2, #0d5cd9)" }}>
                    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
                      📘
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-base leading-tight">Oglej si in se prijavi na Facebooku</p>
                      <p className="text-blue-100 text-sm mt-0.5">Odpri originalni vir, preveri vse podrobnosti in potrditev udeležbe</p>
                    </div>
                    <span className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all text-xl font-bold">→</span>
                  </div>
                  <div className="bg-blue-50 px-6 py-2.5 border-t border-blue-100 flex items-center gap-2">
                    <span className="text-blue-400 text-xs">🔗</span>
                    <span className="text-blue-600 text-xs truncate">{event.sourceUrl}</span>
                  </div>
                </a>
              </section>
            )}

            {/* Facilitator — Wikipedia-style editorial profile */}
            {event.organizer && (
              <section>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: catColor }} />
                  <h2 className="text-xl font-bold text-stone-800">O facilitatorju</h2>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                  {/* Top strip with avatar + name header */}
                  <div
                    className="px-6 pt-6 pb-5 flex items-start gap-5"
                    style={{ background: `linear-gradient(135deg, ${catColor}08 0%, ${catColor}14 100%)`, borderBottom: `1px solid ${catColor}22` }}
                  >
                    {event.organizer.avatarUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                        <Image
                          src={event.organizer.avatarUrl}
                          alt={event.organizer.name}
                          fill
                          className="object-cover [object-position:50%_15%]"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl shadow-sm"
                        style={{ background: `${catColor}20` }}
                      >
                        {emoji}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-stone-800">{event.organizer.name}</h3>
                        {event.organizer.verified && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: catColor }}
                          >
                            ✓ Verificiran
                          </span>
                        )}
                      </div>

                      {/* Specialization tag */}
                      <p className="text-sm font-medium mb-2" style={{ color: catColor }}>
                        {emoji} {label} facilitator · Slovenija
                      </p>

                      {/* Rating row */}
                      {event.organizer.rating > 0 && (
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-sm ${s <= Math.round(event.organizer!.rating) ? "text-amber-400" : "text-stone-200"}`}>★</span>
                          ))}
                          <span className="text-xs font-semibold text-stone-600 ml-1">{event.organizer.rating.toFixed(1)}</span>
                          {event.organizer.reviewCount > 0 && (
                            <span className="text-xs text-stone-400">({event.organizer.reviewCount} ocen)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Biography — multi-paragraph from richBio */}
                  <div className="px-6 py-5 space-y-3 border-b border-stone-50">
                    {enriched.facilitatorBio
                      .split(/\n\n+/)
                      .filter(Boolean)
                      .map((para, i) => (
                        <p key={i} className="text-stone-600 text-sm leading-relaxed">
                          {para.trim()}
                        </p>
                      ))}
                  </div>

                  {/* Quote */}
                  {enriched.facilitatorFact && (
                    <div className="px-6 py-4 border-b border-stone-50">
                      <blockquote
                        className="border-l-[3px] pl-4 italic text-stone-500 text-sm leading-relaxed"
                        style={{ borderColor: catColor }}
                      >
                        {enriched.facilitatorFact}
                      </blockquote>
                    </div>
                  )}

                  {/* Footer: links + profile CTA */}
                  <div className="px-6 py-4 flex flex-wrap items-center gap-3">
                    {event.organizer.instagram && (
                      <a
                        href={`https://instagram.com/${event.organizer.instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: "#e1306c" }}
                      >
                        📸 {event.organizer.instagram.startsWith("@") ? event.organizer.instagram : `@${event.organizer.instagram}`}
                      </a>
                    )}
                    {event.organizer.website && (
                      <a
                        href={event.organizer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-colors"
                      >
                        🌐 Spletna stran
                      </a>
                    )}
                    <Link
                      href={`/organizers/${event.organizer.id}`}
                      className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                      style={{ color: catColor, borderColor: `${catColor}55`, backgroundColor: `${catColor}0d` }}
                    >
                      Celoten profil →
                    </Link>
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
                      <EventCTALink
                        href={event.sourceUrl}
                        eventName={event.titleSl ?? event.titleEn}
                        category={event.category}
                        className="block w-full text-center text-white font-bold py-3.5 rounded-xl text-sm transition-opacity hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${catColor}, ${catDark})` }}
                      >
                        📘 Prijavi se na Facebooku →
                      </EventCTALink>
                    ) : event.organizer?.instagram || event.organizer?.website ? (
                      <div className="space-y-2">
                        <p className="text-xs text-stone-400 text-center mb-1">Kontaktiraj facilitatorja za prijavo</p>
                        {event.organizer.website && (
                          <EventCTALink
                            href={event.organizer.website}
                            eventName={event.titleSl ?? event.titleEn}
                            category={event.category}
                            className="block w-full text-center text-white font-bold py-3 rounded-xl text-sm transition-opacity hover:opacity-90"
                            style={{ background: `linear-gradient(135deg, ${catColor}, ${catDark})` }}
                          >
                            🌐 Spletna stran facilitatorja →
                          </EventCTALink>
                        )}
                        {event.organizer.instagram && (
                          <a
                            href={`https://instagram.com/${event.organizer.instagram.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center font-semibold py-3 rounded-xl text-sm transition-colors"
                            style={{ background: "#fdf2f8", color: "#be185d", border: "1px solid #fbcfe8" }}
                          >
                            📸 Instagram {event.organizer.instagram}
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="block w-full text-center text-stone-500 font-medium py-3.5 rounded-xl text-sm bg-stone-50 border border-stone-200">
                        📧 Kontaktirajte organizatorja
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

        {/* ── RELATED BLOG POSTS ───────────────────────────────────────── */}
        {(() => {
          const relatedBlogs = BLOG_POSTS.filter(
            (p) => p.category === event.category || p.relatedCategories.includes(event.category)
          ).slice(0, 3);
          if (relatedBlogs.length === 0) return null;
          return (
            <section className="mt-16">
              <h2 className="text-xl font-bold text-stone-800 mb-5">Koristni članki</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedBlogs.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="bg-white border border-stone-100 rounded-xl p-4 hover:border-emerald-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{CATEGORY_EMOJI[p.category] ?? "📖"}</span>
                      <span className="text-xs font-medium text-emerald-700">{CATEGORY_LABEL[p.category] ?? p.category}</span>
                    </div>
                    <p className="font-bold text-stone-800 text-sm leading-snug group-hover:text-emerald-700 transition-colors">{p.title}</p>
                    <p className="text-xs text-stone-400 mt-2">{p.readingTime} min branja</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        {/* ── NEWSLETTER — personalised subscribe ──────────────────────────── */}
        <section className="mt-16">
          <SubscribeSection variant="compact" source="event_page" />
        </section>
      </div>
    </>
  );
}

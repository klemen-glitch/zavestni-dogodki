import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateNewsletterMarkdown, buildEditionTitle, buildSubjectLine, publishDraftToBeehiiv } from "@conscious-slovenia/publisher";
import type { ProcessedEvent } from "@conscious-slovenia/ai-processor";

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/admin_token=([^;]+)/);
  return m?.[1] === secret || req.headers.get("x-admin-secret") === secret;
}

function getMonday(date: Date, offsetWeeks = 0): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

// POST: generate a new newsletter draft
export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekOffset = 1 } = await req.json().catch(() => ({}));
  const monday = getMonday(new Date(), weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const events = await db.event.findMany({
    where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: monday, lte: sunday } },
    orderBy: [{ featured: "desc" }, { date: "asc" }],
    include: { organizer: true, venue: true },
  });

  if (events.length === 0) {
    return NextResponse.json({ error: "Ni dogodkov za ta teden" }, { status: 400 });
  }

  const asProcessed = (e: typeof events[0]): ProcessedEvent => ({
    titleSl: e.titleSl, titleEn: e.titleEn,
    descriptionSl: e.descriptionSl, descriptionEn: e.descriptionEn,
    shortDescEn: e.shortDescEn, date: e.date.toISOString(),
    endDate: e.endDate?.toISOString() ?? null, price: e.price, priceNote: e.priceNote,
    currency: "EUR", category: e.category as ProcessedEvent["category"], tags: e.tags,
    location: e.venueName, venueName: e.venue?.name ?? e.venueName,
    organizerName: e.organizer?.name ?? null,
    organizerContact: e.organizer?.email ?? e.organizer?.instagram ?? null,
    imageHint: null, confidence: e.aiConfidence ?? 1,
  });

  const featured = events.filter((e) => e.featured).map(asProcessed);
  const regular = events.filter((e) => !e.featured).map(asProcessed);
  const topCat = (featured[0] ?? regular[0])?.category ?? "OTHER";
  const title = buildEditionTitle(monday);

  const contentMd = generateNewsletterMarkdown({
    title, subjectLine: buildSubjectLine(events.length, topCat),
    previewText: `${events.length} zavestnih dogodkov ta teden v Sloveniji.`,
    weekStart: monday, weekEnd: sunday, featuredEvents: featured, regularEvents: regular,
  });

  const weekNumber = Math.ceil(((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);

  const draft = await db.newsletterDraft.create({
    data: {
      title, subjectLine: buildSubjectLine(events.length, topCat),
      previewText: `${events.length} zavestnih dogodkov ta teden v Sloveniji.`,
      contentMd, status: "DRAFT", weekNumber, year: monday.getFullYear(),
      weekStart: monday, weekEnd: sunday,
      events: { connect: events.map((e) => ({ id: e.id })) },
    },
  });

  return NextResponse.json({ id: draft.id, title, contentMd, eventCount: events.length });
}

// PATCH: publish existing draft to Beehiiv
export async function PATCH(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { draftId } = await req.json();
  const draft = await db.newsletterDraft.findUnique({ where: { id: draftId } });
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const result = await publishDraftToBeehiiv(
    draft.contentMd, draft.subjectLine ?? draft.title, draft.previewText ?? ""
  );

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });

  await db.newsletterDraft.update({
    where: { id: draftId },
    data: { status: "SCHEDULED", externalId: result.externalId, platform: "beehiiv" },
  });

  return NextResponse.json({ ok: true, externalUrl: result.externalUrl });
}

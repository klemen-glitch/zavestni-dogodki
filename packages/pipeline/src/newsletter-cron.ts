import "dotenv/config";
import { prisma } from "@conscious-slovenia/database";
import {
  generateNewsletterMarkdown,
  buildEditionTitle,
  buildSubjectLine,
  publishDraftToBeehiiv,
} from "@conscious-slovenia/publisher";
import type { ProcessedEvent } from "@conscious-slovenia/ai-processor";

/**
 * Weekly newsletter job:
 * 1. Fetch all APPROVED events for the upcoming week
 * 2. Generate Markdown draft
 * 3. Push to Beehiiv as draft
 * 4. Save NewsletterDraft to DB
 */
export async function runWeeklyNewsletter(options: {
  publish?: boolean; // false = save draft only, true = push to Beehiiv
  weekOffset?: number; // 0 = this week, 1 = next week
} = {}): Promise<void> {
  const { publish = false, weekOffset = 1 } = options;

  // Compute the target week window
  const now = new Date();
  const monday = getMonday(now, weekOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  console.log(`\n📰 Newsletter run for ${monday.toDateString()} – ${sunday.toDateString()}`);

  // Fetch events
  const dbEvents = await prisma.event.findMany({
    where: {
      status: { in: ["APPROVED", "FEATURED"] },
      date: { gte: monday, lte: sunday },
    },
    orderBy: [{ featured: "desc" }, { date: "asc" }],
    include: { organizer: true, venue: true },
  });

  if (dbEvents.length === 0) {
    console.log("⚠️  No events for this week. Skipping newsletter.");
    return;
  }

  console.log(`📋 Found ${dbEvents.length} events`);

  // Map to ProcessedEvent shape for the publisher
  const asProcessed = (e: typeof dbEvents[0]): ProcessedEvent => ({
    titleSl: e.titleSl,
    titleEn: e.titleEn,
    descriptionSl: e.descriptionSl,
    descriptionEn: e.descriptionEn,
    shortDescEn: e.shortDescEn,
    date: e.date.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    price: e.price,
    priceNote: e.priceNote,
    currency: (e.currency as "EUR") ?? "EUR",
    category: e.category as ProcessedEvent["category"],
    tags: e.tags,
    location: e.venueName,
    venueName: e.venue?.name ?? e.venueName,
    organizerName: e.organizer?.name ?? null,
    organizerContact: e.organizer?.email ?? e.organizer?.instagram ?? null,
    imageHint: null,
    confidence: e.aiConfidence ?? 1,
  });

  const featured = dbEvents.filter((e) => e.featured).map(asProcessed);
  const regular = dbEvents.filter((e) => !e.featured).map(asProcessed);

  const topCategory = (featured[0] ?? regular[0])?.category ?? "OTHER";
  const title = buildEditionTitle(monday);
  const subjectLine = buildSubjectLine(dbEvents.length, topCategory);
  const previewText = `${dbEvents.length} conscious events this week in Slovenia — yoga, breathwork, cacao & more.`;

  const markdown = generateNewsletterMarkdown({
    title,
    subjectLine,
    previewText,
    weekStart: monday,
    weekEnd: sunday,
    featuredEvents: featured,
    regularEvents: regular,
  });

  // Determine week number
  const weekNumber = getWeekNumber(monday);
  const year = monday.getFullYear();

  // Save draft to DB
  const draft = await prisma.newsletterDraft.create({
    data: {
      title,
      subjectLine,
      previewText,
      contentMd: markdown,
      status: "DRAFT",
      weekNumber,
      year,
      weekStart: monday,
      weekEnd: sunday,
      events: { connect: dbEvents.map((e) => ({ id: e.id })) },
    },
  });

  console.log(`💾 Draft saved to DB (id: ${draft.id})`);

  if (publish) {
    const result = await publishDraftToBeehiiv(markdown, subjectLine, previewText);

    if (result.success) {
      await prisma.newsletterDraft.update({
        where: { id: draft.id },
        data: {
          status: "SCHEDULED",
          externalId: result.externalId,
          platform: "beehiiv",
        },
      });
      console.log(`✅ Published to Beehiiv: ${result.externalUrl}`);
    } else {
      console.error("❌ Beehiiv publish failed:", result.error);
    }
  }

  console.log(`\n✅ Newsletter run complete (${dbEvents.length} events)\n`);
}

function getMonday(date: Date, offsetWeeks = 0): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

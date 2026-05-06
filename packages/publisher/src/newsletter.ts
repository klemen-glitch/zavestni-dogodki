import type { ProcessedEvent } from "@conscious-slovenia/ai-processor";
import type { NewsletterEdition, SponsorBlock } from "./types";

const CATEGORY_EMOJI: Record<string, string> = {
  YOGA: "🧘",
  MEDITATION: "🌀",
  BREATHWORK: "💨",
  SOUND_BATH: "🎵",
  CACAO_CEREMONY: "🍫",
  RETREAT: "🏕️",
  WORKSHOP: "✨",
  DANCE: "💃",
  TANTRA: "🌹",
  HEALING: "🌿",
  OTHER: "🌸",
};

const CATEGORY_LABEL: Record<string, string> = {
  YOGA: "Yoga",
  MEDITATION: "Meditation",
  BREATHWORK: "Breathwork",
  SOUND_BATH: "Sound Bath",
  CACAO_CEREMONY: "Cacao Ceremony",
  RETREAT: "Retreat",
  WORKSHOP: "Workshop",
  DANCE: "Conscious Dance",
  TANTRA: "Tantra",
  HEALING: "Healing",
  OTHER: "Event",
};

function formatPrice(event: ProcessedEvent): string {
  if (event.price === 0) return "Free";
  if (event.price === null) return event.priceNote ?? "Contact organizer";
  return `€${event.price}${event.priceNote ? ` — ${event.priceNote}` : ""}`;
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "Date TBC";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Ljubljana",
  });
}

function formatTime(isoString: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Ljubljana",
  });
  return time === "00:00" ? "" : time;
}

function formatDateRange(event: ProcessedEvent): string {
  const date = formatDate(event.date);
  const time = formatTime(event.date);
  const endTime = event.endDate ? formatTime(event.endDate) : "";

  let result = date;
  if (time) {
    result += ` at ${time}`;
    if (endTime) result += `–${endTime}`;
  }
  return result;
}

function renderEventCard(event: ProcessedEvent, featured = false): string {
  const emoji = CATEGORY_EMOJI[event.category] ?? "🌸";
  const label = CATEGORY_LABEL[event.category] ?? "Event";
  const dateStr = formatDateRange(event);
  const location = event.venueName ?? event.location ?? "Location TBC";
  const price = formatPrice(event);

  const lines: string[] = [];

  if (featured) {
    lines.push(`### ${emoji} ${event.titleEn}`);
    lines.push(``);
    lines.push(`> ${event.descriptionEn}`);
  } else {
    lines.push(`#### ${emoji} ${event.titleEn}`);
    lines.push(``);
    lines.push(event.shortDescEn ?? event.descriptionEn);
  }

  lines.push(``);
  lines.push(`📅 **${dateStr}**`);
  lines.push(`📍 ${location}`);
  lines.push(`💶 ${price}`);
  lines.push(`🏷️ *${label}*`);

  if (event.organizerName) {
    lines.push(`👤 ${event.organizerName}`);
  }

  if (event.organizerContact) {
    lines.push(`📬 ${event.organizerContact}`);
  }

  return lines.join("\n");
}

function groupByCategory(
  events: ProcessedEvent[]
): Map<string, ProcessedEvent[]> {
  const map = new Map<string, ProcessedEvent[]>();
  for (const event of events) {
    const existing = map.get(event.category) ?? [];
    existing.push(event);
    map.set(event.category, existing);
  }
  return map;
}

function renderSponsor(sponsor: SponsorBlock): string {
  return [
    `---`,
    ``,
    `### 💼 Conscious Partner Spotlight`,
    ``,
    `**${sponsor.name}** — ${sponsor.tagline}`,
    ``,
    `[${sponsor.ctaText}](${sponsor.ctaUrl})`,
    ``,
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

export function generateNewsletterMarkdown(edition: NewsletterEdition): string {
  const { title, weekStart, weekEnd, featuredEvents, regularEvents, sponsorBlock } = edition;

  const dateRange = `${weekStart.toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "long",
  })}–${weekEnd.toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Ljubljana",
  })}`;

  const sections: string[] = [];

  // ── Header ──────────────────────────────────────────────────────────────────
  sections.push(`# 🌿 ${title}`);
  sections.push(``);
  sections.push(`*Your curated guide to conscious events in Slovenia — ${dateRange}*`);
  sections.push(``);
  sections.push(`---`);
  sections.push(``);

  // ── Featured events ──────────────────────────────────────────────────────────
  if (featuredEvents.length > 0) {
    sections.push(`## ⭐ Featured This Week`);
    sections.push(``);
    for (const event of featuredEvents) {
      sections.push(renderEventCard(event, true));
      sections.push(``);
      sections.push(`---`);
      sections.push(``);
    }
  }

  // ── Optional sponsor ─────────────────────────────────────────────────────────
  if (sponsorBlock) {
    sections.push(renderSponsor(sponsorBlock));
  }

  // ── Regular events grouped by category ───────────────────────────────────────
  sections.push(`## 📅 This Week's Events`);
  sections.push(``);

  if (regularEvents.length === 0) {
    sections.push(`*No additional events this week. Check back soon!*`);
  } else {
    const grouped = groupByCategory(regularEvents);

    for (const [category, events] of grouped) {
      const emoji = CATEGORY_EMOJI[category] ?? "🌸";
      const label = CATEGORY_LABEL[category] ?? "Events";

      sections.push(`### ${emoji} ${label}`);
      sections.push(``);

      for (const event of events) {
        sections.push(renderEventCard(event, false));
        sections.push(``);
      }
    }
  }

  // ── Footer CTA ───────────────────────────────────────────────────────────────
  sections.push(`---`);
  sections.push(``);
  sections.push(`## 💌 Be Part of the Movement`);
  sections.push(``);
  sections.push(`**Are you a facilitator or venue in Slovenia?**`);
  sections.push(``);
  sections.push(`Get featured in front of our growing community of conscious souls.`);
  sections.push(``);
  sections.push(`- 🌟 [Feature your event](https://zavestnidogodki.si/submit) — reach the right people`);
  sections.push(`- 🤝 [Partnership opportunities](https://zavestnidogodki.si/partner) — long-term visibility`);
  sections.push(`- 🎫 Conscious Pass — exclusive discounts for subscribers *(coming soon)*`);
  sections.push(``);
  sections.push(`---`);
  sections.push(``);
  sections.push(`*You're receiving this because you subscribed to Zavestni Dogodki.*`);
  sections.push(`[Unsubscribe]({{unsubscribe_url}}) · [Update preferences]({{preferences_url}})`);

  return sections.join("\n");
}

export function buildEditionTitle(weekStart: Date): string {
  const weekNum = getWeekNumber(weekStart);
  const year = weekStart.getFullYear();
  return `Zavestni Dogodki — Teden ${weekNum}, ${year}`;
}

export function buildSubjectLine(eventCount: number, topCategory: string): string {
  const emoji = CATEGORY_EMOJI[topCategory] ?? "🌿";
  return `${emoji} ${eventCount} conscious events this week in Slovenia`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

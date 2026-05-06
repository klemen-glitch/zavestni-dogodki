/**
 * Demo: Generate a newsletter markdown from a list of processed events.
 * Run: npx ts-node src/demo.ts
 */

import type { ProcessedEvent } from "@conscious-slovenia/ai-processor";
import {
  generateNewsletterMarkdown,
  buildEditionTitle,
  buildSubjectLine,
} from "./newsletter";
import type { NewsletterEdition } from "./types";

// ── Mock processed events ─────────────────────────────────────────────────────

const MOCK_EVENTS: ProcessedEvent[] = [
  {
    titleSl: "Kakao Ceremonija & Zvočna Kopel",
    titleEn: "Cacao Ceremony & Sound Bath",
    descriptionSl: "Odprite svoja srca s ceremonialnim kakaom in zvočno kopeljo.",
    descriptionEn:
      "Open your heart with ceremonial cacao sourced from Guatemala, followed by a deeply restorative sound bath with crystal singing bowls and gong. This intimate gathering is limited to 15 participants to ensure a sacred container for transformation.",
    shortDescEn:
      "An intimate heart-opening evening with ceremonial cacao and crystal singing bowls in Ljubljana.",
    date: "2026-06-21T18:00:00+02:00",
    endDate: "2026-06-21T20:30:00+02:00",
    price: 25,
    priceNote: "Early bird until June 15 · €30 at the door",
    currency: "EUR",
    category: "CACAO_CEREMONY",
    tags: ["cacao", "sound-healing", "ljubljana", "heart-opening", "ceremony"],
    location: "Trubarjeva 15, Ljubljana",
    venueName: "Yoga Studio Svetloba",
    organizerName: "Ana Kovač",
    organizerContact: "@anakovacyoga",
    imageHint: "person holding a cacao cup with candles and crystals",
    confidence: 0.95,
  },
  {
    titleSl: "Jutranjo Vinyasa Yoga",
    titleEn: "Morning Vinyasa Flow",
    descriptionSl: null,
    descriptionEn:
      "Start your week with an energising Vinyasa flow suitable for all levels. Set intentions, move your body, and step into Monday with clarity and presence.",
    shortDescEn: "Energising Monday morning Vinyasa for all levels in Maribor.",
    date: "2026-06-16T07:30:00+02:00",
    endDate: "2026-06-16T09:00:00+02:00",
    price: 10,
    priceNote: null,
    currency: "EUR",
    category: "YOGA",
    tags: ["yoga", "vinyasa", "morning", "maribor", "all-levels"],
    location: "Maribor",
    venueName: "Urban Yoga Maribor",
    organizerName: "Maja Novak",
    organizerContact: "maja@urbanyoga.si",
    imageHint: "yoga class in morning light wooden studio",
    confidence: 0.88,
  },
  {
    titleSl: "Prosti Dih — Transformativno Dihanje",
    titleEn: "Free Breath — Transformational Breathwork",
    descriptionSl: "Prosti dih je tehnika transformativnega dihanja, ki osvobaja čustvene blokade.",
    descriptionEn:
      "Journey deep within through a guided session of transformational breathwork. This powerful practice releases stored emotions, expands awareness, and leaves you feeling profoundly renewed.",
    shortDescEn: "Deep transformational breathwork to release emotional blocks and expand awareness.",
    date: "2026-06-20T19:00:00+02:00",
    endDate: "2026-06-20T21:30:00+02:00",
    price: 0,
    priceNote: "Po srcu / Heart donation",
    currency: "EUR",
    category: "BREATHWORK",
    tags: ["breathwork", "transformation", "free", "online", "healing"],
    location: "Online (Zoom)",
    venueName: null,
    organizerName: "David Zupan",
    organizerContact: "@davidzupan_breath",
    imageHint: "person lying in savasana with glowing energy field",
    confidence: 0.91,
  },
];

async function main() {
  const weekStart = new Date("2026-06-15T00:00:00+02:00");
  const weekEnd = new Date("2026-06-21T23:59:59+02:00");

  const edition: NewsletterEdition = {
    title: buildEditionTitle(weekStart),
    subjectLine: buildSubjectLine(MOCK_EVENTS.length, "CACAO_CEREMONY"),
    previewText:
      "Cacao ceremony, morning yoga, transformational breathwork and more — your week in conscious Slovenia.",
    weekStart,
    weekEnd,
    featuredEvents: [MOCK_EVENTS[0]],  // first event is featured
    regularEvents: MOCK_EVENTS.slice(1),
    sponsorBlock: {
      name: "Yoga Republic",
      tagline: "Premium yoga gear made sustainably in Europe",
      ctaText: "Get 15% off with code ZAVESTNI",
      ctaUrl: "https://yogarepublic.si/?ref=zavestni",
    },
  };

  const markdown = generateNewsletterMarkdown(edition);

  console.log("📰 Conscious Slovenia — Newsletter Draft\n");
  console.log("Subject:", edition.subjectLine);
  console.log("Preview:", edition.previewText);
  console.log("\n" + "─".repeat(70) + "\n");
  console.log(markdown);
  console.log("\n" + "─".repeat(70));
  console.log(`\n✅ ${markdown.split("\n").length} lines generated`);
  console.log(
    "💡 To publish: call publishDraftToBeehiiv(markdown, subject, preview)"
  );
}

main().catch(console.error);

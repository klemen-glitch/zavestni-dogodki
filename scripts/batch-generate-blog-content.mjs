/**
 * Batch triggers blog content generation for ALL existing approved events
 * that don't yet have a matching blog post slug.
 *
 * Deduplicates by (category, city) pair to avoid generating redundant articles.
 * Runs sequentially with a 30s gap between triggers to avoid GitHub rate limits.
 *
 * Usage:
 *   GH_DISPATCH_TOKEN=... node scripts/batch-generate-blog-content.mjs
 *   GH_DISPATCH_TOKEN=... node scripts/batch-generate-blog-content.mjs --dry-run
 */

import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");
const GH_OWNER = "klemen-glitch";
const GH_REPO = "zavestni-dogodki";
const DELAY_BETWEEN_MS = 30_000; // 30s between dispatches

const CATEGORY_LABELS = {
  YOGA: "Joga", MEDITATION: "Meditacija", BREATHWORK: "Breathwork",
  SOUND_BATH: "Zvočna kopel", CACAO_CEREMONY: "Kakao ceremonija",
  RETREAT: "Retreat", WORKSHOP: "Delavnica", DANCE: "Ples",
  TANTRA: "Tantra", HEALING: "Zdravljenje",
};

function slugify(str) {
  return str.toLowerCase()
    .replace(/[čć]/g, "c").replace(/š/g, "s").replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function extractCity(location) {
  if (!location) return "Ljubljana";
  const parts = location.split(",").map((p) => p.trim());
  const last = parts[parts.length - 1];
  const match = last.match(/^\d{4}\s+(.+)$/);
  return match ? match[1] : last || "Ljubljana";
}

function getExistingSlugs() {
  const content = readFileSync(resolve(ROOT, "apps/web/src/content/blog-posts.ts"), "utf8");
  return new Set([...content.matchAll(/slug:\s*["']([^"']+)["']/g)].map((m) => m[1]));
}

function wouldGenerateDuplicate(category, city, organizerName, existingSlugs) {
  const catSlug = slugify(CATEGORY_LABELS[category] || category);
  const citySlug = slugify(city);
  const orgSlug = organizerName ? slugify(organizerName) : null;

  // Check if type article already exists
  if (existingSlugs.has(`${catSlug}-v-sloveniji`)) return true;
  // Check if location article already exists
  if (existingSlugs.has(`${catSlug}-v-${citySlug}`)) return true;
  return false;
}

async function dispatch(event) {
  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) throw new Error("GH_DISPATCH_TOKEN env var required");

  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "generate-blog-content",
        client_payload: {
          event_id: event.id,
          title: event.titleSl || event.titleEn,
          category: event.category,
          city: event.city,
          organizer_name: event.organizerName || "",
          organizer_bio: event.organizerBio || "",
          description: event.descriptionEn || "",
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body}`);
  }
}

async function main() {
  console.log(`🚀 Batch Blog Content Generator`);
  console.log(`   dry-run: ${DRY_RUN}`);
  console.log(`   delay between dispatches: ${DELAY_BETWEEN_MS / 1000}s\n`);

  // Load DB
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    // Fetch all approved events with organizer info
    const events = await prisma.event.findMany({
      where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } },
      include: { organizer: true, venue: true },
      orderBy: { date: "asc" },
    });

    console.log(`📋 Found ${events.length} upcoming approved events`);

    const existingSlugs = getExistingSlugs();
    console.log(`📖 Found ${existingSlugs.size} existing blog post slugs\n`);

    // Deduplicate: one dispatch per unique (category, city) pair
    const seen = new Set();
    const toDispatch = [];

    for (const event of events) {
      const city = event.venue?.city || extractCity(event.venueName || "");
      const key = `${event.category}::${city}`;

      if (seen.has(key)) continue;
      seen.add(key);

      if (wouldGenerateDuplicate(event.category, city, event.organizer?.name, existingSlugs)) {
        console.log(`⏭  Already have articles for ${event.category} in ${city} — skipping`);
        continue;
      }

      toDispatch.push({
        id: event.id,
        titleSl: event.titleSl,
        titleEn: event.titleEn,
        category: event.category,
        city,
        organizerName: event.organizer?.name || null,
        organizerBio: event.organizer?.bio || null,
        descriptionEn: event.descriptionEn || null,
      });
    }

    console.log(`\n🎯 ${toDispatch.length} unique (category, city) combos need articles\n`);

    for (let i = 0; i < toDispatch.length; i++) {
      const ev = toDispatch[i];
      const label = `[${i + 1}/${toDispatch.length}] ${ev.category} in ${ev.city} — "${ev.titleSl || ev.titleEn}"`;

      if (DRY_RUN) {
        console.log(`   (dry-run) Would dispatch: ${label}`);
        continue;
      }

      console.log(`📤 Dispatching: ${label}`);
      await dispatch(ev);
      console.log(`   ✅ Dispatched — GitHub Actions will generate articles in ~6 min`);

      if (i < toDispatch.length - 1) {
        console.log(`   ⏳ Waiting ${DELAY_BETWEEN_MS / 1000}s before next dispatch...`);
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_MS));
      }
    }

    console.log(`\n🎉 Done! Dispatched ${DRY_RUN ? 0 : toDispatch.length} generation workflows.`);
    if (!DRY_RUN) {
      console.log(`   Articles will auto-commit to main within ~6 minutes each.`);
      console.log(`   Monitor: https://github.com/${GH_OWNER}/${GH_REPO}/actions`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Batch generation failed:", err);
  process.exit(1);
});

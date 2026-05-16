/**
 * Update event images with better category-specific Unsplash images.
 * Falls back to og:image from sourceUrl when available.
 *
 * Usage: node scripts/update-event-images.mjs [--dry-run]
 */

import { PrismaClient } from "@conscious-slovenia/database";

const db = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

// High-quality Unsplash photos per category (curated IDs for accuracy)
const CATEGORY_IMAGES = {
  YOGA: [
    "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&h=500&fit=crop",
  ],
  MEDITATION: [
    "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1593811167562-9c2d9d8bdc8e?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=800&h=500&fit=crop",
  ],
  BREATHWORK: [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1506126279646-a697353d3166?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=500&fit=crop",
  ],
  SOUND_BATH: [
    "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1591291621164-2c6367723315?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=500&fit=crop",
  ],
  CACAO_CEREMONY: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?w=800&h=500&fit=crop",
  ],
  RETREAT: [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&h=500&fit=crop",
  ],
  WORKSHOP: [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=800&h=500&fit=crop",
  ],
  DANCE: [
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&h=500&fit=crop",
  ],
  TANTRA: [
    "https://images.unsplash.com/photo-1535916707207-35f997b0f28d?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop",
  ],
  HEALING: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=500&fit=crop",
  ],
  OTHER: [
    "https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=500&fit=crop",
  ],
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
  Accept: "text/html,application/xhtml+xml",
};

async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal, redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? m[1].replace(/&amp;/g, "&") : null;
  } catch { return null; }
}

let imageIndexes = {};
function pickImage(category) {
  const pool = CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.OTHER;
  const idx = imageIndexes[category] ?? 0;
  imageIndexes[category] = (idx + 1) % pool.length;
  return pool[idx];
}

async function main() {
  console.log(`\n🖼️  Updating event images...${DRY_RUN ? " [DRY RUN]" : ""}\n`);

  const events = await db.event.findMany({
    select: { id: true, titleEn: true, titleSl: true, category: true, sourceUrl: true, imageUrl: true },
    orderBy: { category: "asc" },
  });

  console.log(`Processing ${events.length} events...\n`);
  let updated = 0;

  for (const event of events) {
    const title = (event.titleSl ?? event.titleEn).slice(0, 50);
    let newImageUrl = null;

    // First try: fetch real og:image from sourceUrl
    if (event.sourceUrl) {
      process.stdout.write(`  🔍 ${title} (from source)... `);
      newImageUrl = await fetchOgImage(event.sourceUrl);
      if (newImageUrl) {
        console.log(`✅ got real image`);
      } else {
        console.log(`❌ no og:image`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    // Fallback: pick best category image
    if (!newImageUrl) {
      newImageUrl = pickImage(event.category);
      console.log(`  📁 ${title} → category image (${event.category})`);
    }

    if (!DRY_RUN && newImageUrl !== event.imageUrl) {
      await db.event.update({
        where: { id: event.id },
        data: { imageUrl: newImageUrl },
      });
      updated++;
    } else if (DRY_RUN) {
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated}/${events.length} events\n`);
  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

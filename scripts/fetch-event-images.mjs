/**
 * Fetch real event cover images from Facebook event URLs (og:image).
 * Updates imageUrl in DB for all events that have a sourceUrl.
 *
 * Usage: node scripts/fetch-event-images.mjs [--dry-run]
 */

import { PrismaClient } from "@conscious-slovenia/database";

const db = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "sl,en;q=0.9",
};

async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    // Try og:image first
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch) return decodeHTMLEntities(ogMatch[1]);

    // Try twitter:image
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
    if (twMatch) return decodeHTMLEntities(twMatch[1]);

    return null;
  } catch (e) {
    return null;
  }
}

function decodeHTMLEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function isStockImage(url) {
  if (!url) return true;
  return url.includes("unsplash.com") || url.includes("pexels.com") || url.includes("pixabay.com");
}

async function main() {
  console.log(`\n🖼️  Fetching real event images from Facebook...${DRY_RUN ? " [DRY RUN]" : ""}\n`);

  const events = await db.event.findMany({
    where: { sourceUrl: { not: null } },
    select: { id: true, titleEn: true, titleSl: true, sourceUrl: true, imageUrl: true },
  });

  console.log(`Found ${events.length} events with sourceUrl\n`);

  let updated = 0, failed = 0, skipped = 0;

  for (const event of events) {
    const title = (event.titleSl ?? event.titleEn).slice(0, 50);
    const hasStockImage = isStockImage(event.imageUrl);

    if (!hasStockImage) {
      console.log(`  ⏭️  ${title} — already has real image`);
      skipped++;
      continue;
    }

    process.stdout.write(`  🔍 ${title}... `);
    const imgUrl = await fetchOgImage(event.sourceUrl);

    if (!imgUrl) {
      console.log(`❌ no image found`);
      failed++;
      continue;
    }

    // Validate it's a real image URL
    if (!imgUrl.startsWith("http")) {
      console.log(`❌ invalid URL: ${imgUrl.slice(0, 40)}`);
      failed++;
      continue;
    }

    console.log(`✅ ${imgUrl.slice(0, 60)}`);

    if (!DRY_RUN) {
      await db.event.update({
        where: { id: event.id },
        data: {
          imageUrl: imgUrl,
          rawText: null, // Clear AI cache so enrichment re-runs with correct location context
        },
      });
    }
    updated++;

    // Rate limit — be polite to FB servers
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n📊 Results: ${updated} updated, ${skipped} skipped (real image), ${failed} failed\n`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

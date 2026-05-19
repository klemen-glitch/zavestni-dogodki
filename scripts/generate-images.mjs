/**
 * AI image generation for blog posts and events.
 *
 * Uses DeepSeek to craft optimised Flux image prompts,
 * then Pollinations.ai (free, no key needed) for actual generation.
 *
 * Targets:
 *   - Last 3 blog posts  → adds imageUrl to 2-3 content sections each
 *   - Last 3 events (DB) → sets imageUrl (hero) + sectionImages (rawText JSON)
 *
 * Usage: node scripts/generate-images.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BLOG_POSTS_PATH = resolve(ROOT, "apps/web/src/content/blog-posts.ts");
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY ?? "sk-2650281ff60244c0b2c6152f210dc542";
const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres.utvpwrsuyariuamkidlm:Kakk.sup123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function deepseekPrompt(context) {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You generate concise, vivid Stable Diffusion / Flux image prompts for a Slovenian wellness brand. Return ONLY the prompt string, no explanation, no quotes. Max 60 words.",
        },
        {
          role: "user",
          content: `Create a photorealistic wellness photography prompt for: ${context}\nStyle requirements: warm golden natural light, cream and sage color palette, editorial wellness photography, clean minimal composition, no text, no watermarks, professional DSLR quality, 16:9 aspect ratio.`,
        },
      ],
      max_tokens: 120,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content.trim().replace(/^["']|["']$/g, "");
}

function pollinationsUrl(prompt, seed = 42) {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1280&height=720&nologo=true&seed=${seed}`;
}

// Warm up a pollinations URL (triggers generation so it's cached)
async function warmUp(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    console.log(`  ✓ warmed up`);
  } catch {
    console.log(`  ⚠ warm-up timed out (image will generate on first page load)`);
  }
}

// ── Blog post image generation ────────────────────────────────────────────────

// Context strings for each post's image slots
const BLOG_IMAGE_CONTEXTS = {
  "kaj-je-zvocna-kopel": [
    // slot index → context
    [0, "person lying peacefully in a sound bath session, tibetan singing bowls arranged around them, warm candlelight, zen atmosphere"],
    [2, "close-up group sound healing session, people resting on yoga mats, soft diffused light, healing circle"],
    [5, "crystal singing bowls glowing in soft studio light, artistic bokeh background, multiple bowls different sizes"],
  ],
  "breathwork-za-zacetnike": [
    [0, "woman practicing deep breathing meditation outdoors at golden hour, hands on chest, serene expression, Slovenian mountain backdrop"],
    [3, "close-up of person doing breathwork, eyes closed, sunlit studio, white linen clothing, peace and focus"],
    [6, "Wim Hof style cold morning meditation, person in nature next to alpine lake, mist on water, early morning light"],
  ],
  "10-razlogov-za-yoga-retreat": [
    [0, "yoga practitioner in warrior pose at sunrise, Slovenian Alps in background, golden morning light, mist in valley"],
    [4, "serene wooden yoga retreat center in forest, green canopy, warm interior lighting visible, peaceful garden path"],
    [8, "small group yoga class on outdoor deck overlooking mountains, instructor adjusting student, joyful community atmosphere"],
  ],
};

async function generateBlogImages() {
  console.log("\n📖 Generating blog post images…\n");

  let source = readFileSync(BLOG_POSTS_PATH, "utf8");

  for (const [slug, slots] of Object.entries(BLOG_IMAGE_CONTEXTS)) {
    console.log(`  Blog: ${slug}`);
    for (const [sectionIndex, context] of slots) {
      console.log(`    Section ${sectionIndex}: generating prompt…`);
      const prompt = await deepseekPrompt(context);
      console.log(`    Prompt: ${prompt.slice(0, 80)}…`);
      const imageUrl = pollinationsUrl(prompt, 100 + sectionIndex);
      console.log(`    URL: ${imageUrl.slice(0, 80)}…`);
      await warmUp(imageUrl);

      // Inject imageUrl into the content section in the TypeScript source
      // Strategy: find the section by its position in the slug's content array
      // We patch the source by finding the Nth `body:` occurrence inside the slug block
      source = injectImageIntoSection(source, slug, sectionIndex, imageUrl);
    }
  }

  writeFileSync(BLOG_POSTS_PATH, source, "utf8");
  console.log(`\n  ✅ blog-posts.ts updated`);
}

/**
 * Injects `imageUrl: "..."` after the `body: "..."` of the Nth section
 * in the slug's content array, within the TypeScript source string.
 */
function injectImageIntoSection(source, slug, sectionIndex, imageUrl) {
  // Find the slug's block start
  const slugMarker = `slug: "${slug}"`;
  const slugPos = source.indexOf(slugMarker);
  if (slugPos === -1) {
    console.warn(`    ⚠ slug "${slug}" not found in source — skipping`);
    return source;
  }

  // Find the next slug start (end boundary of this block)
  const nextSlugPos = source.indexOf('slug: "', slugPos + slugMarker.length);
  const blockEnd = nextSlugPos === -1 ? source.length : nextSlugPos;
  const block = source.slice(slugPos, blockEnd);

  // Count `body:` occurrences up to the Nth one
  let pos = 0;
  let count = 0;
  while (count <= sectionIndex) {
    const found = block.indexOf("body:", pos);
    if (found === -1) {
      console.warn(`    ⚠ section ${sectionIndex} not found in "${slug}" — skipping`);
      return source;
    }
    if (count === sectionIndex) {
      // Find the end of this body value (closing quote + possible comma)
      // body: "..." ends with `",` or `"\n` or `"  }` etc.
      const afterBody = block.indexOf('"', found + 6); // skip `body: "`
      if (afterBody === -1) return source;
      // Find the closing quote of the body string (handle escaped quotes)
      let closeQuote = afterBody;
      while (true) {
        closeQuote = block.indexOf('"', closeQuote + 1);
        if (closeQuote === -1) return source;
        // Check it's not escaped
        let backslashes = 0;
        let bp = closeQuote - 1;
        while (bp >= 0 && block[bp] === "\\") { backslashes++; bp--; }
        if (backslashes % 2 === 0) break;
      }

      // Check if imageUrl already exists right after this body
      const afterClose = block.slice(closeQuote + 1, closeQuote + 80);
      if (afterClose.includes("imageUrl:")) {
        // Replace existing imageUrl
        const imgStart = slugPos + closeQuote + 1 + afterClose.indexOf("imageUrl:");
        const imgLineEnd = source.indexOf("\n", imgStart);
        const replacement = `imageUrl: "${imageUrl}"`;
        source = source.slice(0, imgStart) + replacement + source.slice(imgLineEnd);
        return source;
      }

      // Insert imageUrl after the closing quote of body
      const insertPos = slugPos + closeQuote + 1;
      const insert = `,\n        imageUrl: "${imageUrl}"`;
      source = source.slice(0, insertPos) + insert + source.slice(insertPos);
      return source;
    }
    pos = found + 1;
    count++;
  }
  return source;
}

// ── Event image generation ────────────────────────────────────────────────────

const { PrismaClient } = await import("../node_modules/@prisma/client/index.js");

async function generateEventImages() {
  console.log("\n📅 Generating event images…\n");

  const db = new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
  });

  try {
    const events = await db.event.findMany({
      where: { status: { in: ["APPROVED", "FEATURED"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, titleEn: true, titleSl: true, category: true, rawText: true },
    });

    for (const event of events) {
      const title = event.titleSl ?? event.titleEn;
      const category = event.category;
      console.log(`  Event: ${title} [${category}]`);

      // Generate 3 image prompts: 1 hero + 2 section
      const heroContext = `${title} — ${category.toLowerCase().replace("_", " ")} wellness event in Slovenia`;
      const section1Context = `${category.toLowerCase().replace("_", " ")} practice in session, participants in a circle, cozy indoor Slovenia venue`;
      const section2Context = `${category.toLowerCase().replace("_", " ")} close-up details, hands, instruments, or nature setting, Slovenia alpine region`;

      console.log(`    Generating hero prompt…`);
      const heroPrompt = await deepseekPrompt(heroContext);
      const heroUrl = pollinationsUrl(heroPrompt, 200);
      console.log(`    Hero: ${heroUrl.slice(0, 70)}…`);
      await warmUp(heroUrl);

      console.log(`    Generating section 1 prompt…`);
      const s1Prompt = await deepseekPrompt(section1Context);
      const s1Url = pollinationsUrl(s1Prompt, 201);
      await warmUp(s1Url);

      console.log(`    Generating section 2 prompt…`);
      const s2Prompt = await deepseekPrompt(section2Context);
      const s2Url = pollinationsUrl(s2Prompt, 202);
      await warmUp(s2Url);

      // Parse existing rawText (may have enrichment cache)
      let rawData = {};
      if (event.rawText) {
        try { rawData = JSON.parse(event.rawText); } catch {}
      }

      // Update DB: set imageUrl (hero) + merge sectionImages into rawText
      await db.event.update({
        where: { id: event.id },
        data: {
          imageUrl: heroUrl,
          rawText: JSON.stringify({ ...rawData, sectionImages: [s1Url, s2Url] }),
        },
      });

      console.log(`    ✅ DB updated`);
    }
  } finally {
    await db.$disconnect();
  }
}

// ── Run ───────────────────────────────────────────────────────────────────────

try {
  await generateBlogImages();
  await generateEventImages();
  console.log("\n🎉 All done! Commit the updated blog-posts.ts and deploy.\n");
} catch (err) {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
}

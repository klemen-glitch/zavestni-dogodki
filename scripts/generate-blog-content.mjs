/**
 * Auto-generates 3 SEO blog posts per approved event:
 *   1. Event Type / Theme article (e.g. "Breathwork v Sloveniji")
 *   2. Location article        (e.g. "Joga v Ljubljani")
 *   3. Facilitator article     (e.g. "Ana Novak — Breathwork Facilitatorka")
 *
 * Uses Anthropic API with web_search for deep research.
 * Appends results to apps/web/src/content/blog-posts.ts and git-commits them.
 *
 * Run via GitHub Actions (generate-blog-content.yml) — NOT in Vercel serverless.
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// ── Paths ──────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BLOG_POSTS_PATH = resolve(ROOT, "apps/web/src/content/blog-posts.ts");

// ── Config ─────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split("T")[0];
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORY_LABELS = {
  YOGA: "Joga",
  MEDITATION: "Meditacija",
  BREATHWORK: "Breathwork",
  SOUND_BATH: "Zvočna kopel",
  CACAO_CEREMONY: "Kakao ceremonija",
  RETREAT: "Retreat",
  WORKSHOP: "Delavnica",
  DANCE: "Ples",
  TANTRA: "Tantra",
  HEALING: "Zdravljenje",
};

// ── Event data from environment ────────────────────────────────────────────
const event = {
  id: process.env.EVENT_ID,
  title: process.env.EVENT_TITLE || "",
  category: process.env.EVENT_CATEGORY || "YOGA",
  city: process.env.EVENT_CITY || "Ljubljana",
  organizerName: process.env.ORGANIZER_NAME || "",
  organizerBio: process.env.ORGANIZER_BIO || "",
  organizerWebsite: process.env.ORGANIZER_WEBSITE || "",
  description: process.env.EVENT_DESCRIPTION || "",
};

if (!event.id) {
  console.error("❌ EVENT_ID environment variable is required");
  process.exit(1);
}

console.log(`🚀 Generating blog content for event: "${event.title}" (${event.id})`);
console.log(`   Category: ${event.category} | City: ${event.city} | Organizer: ${event.organizerName}`);

// ── Slug utils ─────────────────────────────────────────────────────────────
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getExistingSlugs() {
  const content = readFileSync(BLOG_POSTS_PATH, "utf8");
  return new Set([...content.matchAll(/slug:\s*["']([^"']+)["']/g)].map((m) => m[1]));
}

function uniqueSlug(base, alternatives, existingSlugs) {
  if (!existingSlugs.has(base)) return base;
  for (const alt of alternatives) {
    if (!existingSlugs.has(alt)) return alt;
  }
  const withYear = `${base}-2026`;
  return existingSlugs.has(withYear) ? `${base}-vodic-2026` : withYear;
}

// ── Anthropic call with web search + fallback ──────────────────────────────
async function callClaude(system, userMsg) {
  const messages = [{ role: "user", content: userMsg }];

  // Try with web search first
  try {
    const resp = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 10000,
      system,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages,
    });
    const text = resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    if (text.trim()) return text;
  } catch (err) {
    console.warn(`   ⚠️  Web search unavailable (${err.message}), falling back…`);
  }

  // Fallback: plain generation without web search
  const resp = await anthropic.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 10000,
    system,
    messages,
  });
  return resp.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

function extractJson(text) {
  // Try to find a JSON object in the response
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in Claude response");
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    // Try stripping markdown fences
    const stripped = text.replace(/```json\n?|```\n?/g, "").trim();
    const m2 = stripped.match(/\{[\s\S]*\}/);
    if (!m2) throw new Error("JSON parse failed: " + e.message);
    return JSON.parse(m2[0]);
  }
}

// ── Article 1: Event Type / Theme ──────────────────────────────────────────
async function generateTypeArticle(existingSlugs) {
  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  const catSlug = slugify(catLabel);

  const slug = uniqueSlug(
    `${catSlug}-v-sloveniji`,
    [
      `${catSlug}-za-zacetnike`,
      `${catSlug}-koristi-in-ucinki`,
      `${catSlug}-vadba-slovenija`,
      `kaj-je-${catSlug}`,
    ],
    existingSlugs
  );

  const system = `Si strokovni SEO pisec za slovensko platformo Zavestni Dogodki (zavestnidogodki.si) — kurirani imenik joga delavnic, meditacij, breathwork sej, zvočnih kopeli in retreatov v Sloveniji.
Pišeš dolge, faktografske, izjemno koristne vsebine v slovenščini, ki:
- Rangirajo pri Google za long-tail ključne besede
- Pridobivajo citate pri AI iskalnikih (ChatGPT, Perplexity, Gemini)
- Vsebujejo specifične cene v EUR, statistike in primere iz slovenskega konteksta
VEDNO vrni SAMO veljavni JSON objekt — brez uvoda, razlage ali markdown.`;

  const prompt = `Globoko razišči in napiši avtoritativni SEO blog post o "${catLabel} v Sloveniji" za leto 2026.

KONTEKST: Promoviramo ta konkreten dogodek: "${event.title}" v mestu ${event.city}. Vodja: ${event.organizerName}.
${event.description ? `Opis: ${event.description}` : ""}

ZAHTEVE:
- Slug: "${slug}" (ne spremeniti!)
- Primarni keyword: "${catSlug} v sloveniji"
- Title: 50–60 znakov, keyword blizu začetka
- Description: 120–155 znakov, vsebuje keyword + CTA glagol (Odkrijte, Naučite se, Preberite)
- Content: 7–9 H2 sekcij (200–400 besed vsaka), naslovi v obliki vprašanj za AEO
  * Vključi: kaj je praksa, kako deluje, koristi, cene v Sloveniji, kje najti, kako se pripraviti, za koga je primerno
- FAQ: 9–12 vprašanj z neposrednimi odgovori (2–5 stavkov)
  * OBVEZNO: vprašanje o cenah z EUR zneski, vprašanje "kje najdem v Sloveniji" → odgovor omeni Zavestni Dogodki
- HowTo koraki: 6–8 korakov za popolne začetnike
- readingTime: oceni po word count ÷ 200 (zaokroži navzgor)
- relatedCategories: 2–4 iz [YOGA, MEDITATION, BREATHWORK, SOUND_BATH, CACAO_CEREMONY, RETREAT, WORKSHOP, DANCE, TANTRA, HEALING]
- author: "Uredništvo Zavestni Dogodki"

Vrni SAMO ta JSON:
{
  "slug": "${slug}",
  "title": "string",
  "description": "string",
  "date": "${TODAY}",
  "dateModified": "${TODAY}",
  "category": "${event.category}",
  "readingTime": <integer>,
  "author": "Uredništvo Zavestni Dogodki",
  "content": [
    { "body": "string" },
    { "heading": "string (vprašanje?)", "body": "string" },
    ...
  ],
  "faq": [
    { "question": "string", "answer": "string" },
    ...
  ],
  "relatedCategories": ["string", ...],
  "howToSteps": [
    { "name": "string", "text": "string" },
    ...
  ]
}`;

  console.log(`\n📝 Generating type article: ${slug}`);
  const raw = await callClaude(system, prompt);
  const post = extractJson(raw);
  post.slug = slug; // ensure slug matches
  existingSlugs.add(slug);
  return post;
}

// ── Article 2: Location ────────────────────────────────────────────────────
async function generateLocationArticle(existingSlugs) {
  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  const catSlug = slugify(catLabel);
  const citySlug = slugify(event.city);

  const slug = uniqueSlug(
    `${catSlug}-v-${citySlug}`,
    [
      `${catSlug}-${citySlug}-delavnice`,
      `${catSlug}-${citySlug}-studiji-2026`,
      `zavestni-dogodki-${citySlug}`,
    ],
    existingSlugs
  );

  const system = `Si strokovni pisec lokalnega SEO za slovensko platformo Zavestni Dogodki. Specializiran si za wellness sceno v posameznih mestih Slovenije. Pišeš konkretne, lokalno relevantne vsebine z imeni četrti, prevoznih zvez in priporočili iz prve roke. VEDNO vrni SAMO veljavni JSON objekt.`;

  const prompt = `Razišči in napiši lokalni SEO blog post o "${catLabel} v ${event.city}" za leto 2026.

KONTEKST: Promoviramo ta konkreten dogodek: "${event.title}". Vodja: ${event.organizerName}.

ZAHTEVE:
- Slug: "${slug}" (ne spremeniti!)
- Primarni keyword: "${catSlug} v ${citySlug}"
- Title: 55–65 znakov, vsebuje ime mesta in kategorijo
- Description: 120–155 znakov
- Content: 6–8 H2 sekcij — zajemi:
  * Uvod o sceni v mestu
  * Zakaj ravno ${event.city} za ${catLabel}
  * Najboljše lokacije / četrti v mestu
  * Cene (konkretni EUR zneski)
  * Kdaj iti (sezonska priporočila)
  * Prevoz / kako priti
  * Nasveti za lokalne začetnike
- FAQ: 7–9 vprašanj s specifičnimi lokalnimi odgovori (cene, lokacije, prevoz)
- NE vključuj howToSteps (ni relevantno za lokalni vodič)
- relatedCategories: 2–3 relevantnih

Vrni SAMO ta JSON:
{
  "slug": "${slug}",
  "title": "string",
  "description": "string",
  "date": "${TODAY}",
  "dateModified": "${TODAY}",
  "category": "${event.category}",
  "readingTime": <integer>,
  "author": "Uredništvo Zavestni Dogodki",
  "content": [
    { "body": "string" },
    { "heading": "string", "body": "string" },
    ...
  ],
  "faq": [
    { "question": "string", "answer": "string" },
    ...
  ],
  "relatedCategories": ["string", ...]
}`;

  console.log(`\n📍 Generating location article: ${slug}`);
  const raw = await callClaude(system, prompt);
  const post = extractJson(raw);
  post.slug = slug;
  existingSlugs.add(slug);
  return post;
}

// ── Article 3: Facilitator / Person ───────────────────────────────────────
async function generateFacilitatorArticle(existingSlugs) {
  if (!event.organizerName || event.organizerName.trim() === "") {
    console.log("\n⏭️  Skipping facilitator article (no organizer name)");
    return null;
  }

  const catLabel = CATEGORY_LABELS[event.category] || event.category;
  const catSlug = slugify(catLabel);
  const orgSlug = slugify(event.organizerName);
  const citySlug = slugify(event.city);

  const slug = uniqueSlug(
    `${orgSlug}-${catSlug}-facilitator`,
    [
      `${orgSlug}-${catSlug}-${citySlug}`,
      `${orgSlug}-zavestni-dogodki`,
      `${orgSlug}-wellness-facilitator`,
    ],
    existingSlugs
  );

  const system = `Si strokovni pisec za E-E-A-T optimizacijo wellness facilitatorjev v Sloveniji. Pišeš avtoritativne profile, ki gradijo zaupanje, osebno blagovno znamko in dokazujejo strokovno znanje. Ton: profesionalen, topel, iskren — ne marketinški in ne pretirano hvalisav. VEDNO vrni SAMO veljavni JSON objekt.`;

  const prompt = `Razišči in napiši profil wellness facilitatorja za SEO in E-E-A-T optimizacijo.

FACILITATOR:
- Ime: ${event.organizerName}
- Specialnost: ${catLabel}
- Mesto: ${event.city}
- Bio: ${event.organizerBio || "Izkušen wellness facilitator v Sloveniji"}
- Spletna stran: ${event.organizerWebsite || "N/A"}
- Prihajajoč dogodek: "${event.title}"

ZAHTEVE:
- Slug: "${slug}" (ne spremeniti!)
- Title: "[Ime] — [Specialnost] Facilitator/ka v [Mestu]" (prilagodi spol glede na ime)
- Description: 120–155 znakov, omeni specialnost in mesto
- Content: 5–7 sekcij:
  * Uvod (kdo je, kaj počne)
  * Filozofija in pristop
  * Izobrazbena pot in izkušnje
  * Slog poučevanja in kaj pričakovati na seji
  * Komu je primeren
  * Kako se prijaviti / kontakt (splošno)
- FAQ: 6–8 praktičnih vprašanj o delu tega facilitatorja
- NE vključuj howToSteps
- relatedCategories: 2–3 relevantnih
- author: "Uredništvo Zavestni Dogodki"

Vrni SAMO ta JSON:
{
  "slug": "${slug}",
  "title": "string",
  "description": "string",
  "date": "${TODAY}",
  "dateModified": "${TODAY}",
  "category": "${event.category}",
  "readingTime": <integer>,
  "author": "Uredništvo Zavestni Dogodki",
  "content": [
    { "body": "string" },
    { "heading": "string", "body": "string" },
    ...
  ],
  "faq": [
    { "question": "string", "answer": "string" },
    ...
  ],
  "relatedCategories": ["string", ...]
}`;

  console.log(`\n👤 Generating facilitator article: ${slug}`);
  const raw = await callClaude(system, prompt);
  const post = extractJson(raw);
  post.slug = slug;
  return post;
}

// ── Append posts to blog-posts.ts ──────────────────────────────────────────
function appendToBlogPosts(newPosts) {
  let content = readFileSync(BLOG_POSTS_PATH, "utf8");

  for (const post of newPosts) {
    // Serialize with 2-space indent, then add 2-space outer indent
    const serialized = "  " + JSON.stringify(post, null, 2).replace(/\n/g, "\n  ");
    // Insert before the closing ]; that precedes the getBlogPost export
    content = content.replace(
      /\n\];\s*\nexport function getBlogPost/,
      `\n${serialized},\n];\n\nexport function getBlogPost`
    );
  }

  writeFileSync(BLOG_POSTS_PATH, content, "utf8");
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const existingSlugs = getExistingSlugs();
  console.log(`   Found ${existingSlugs.size} existing blog posts`);

  const generated = [];

  // 1. Event type article
  const typeArticle = await generateTypeArticle(existingSlugs);
  generated.push(typeArticle);
  console.log(`   ✅ Type article done: ${typeArticle.slug}`);

  // 2. Location article
  const locationArticle = await generateLocationArticle(existingSlugs);
  generated.push(locationArticle);
  console.log(`   ✅ Location article done: ${locationArticle.slug}`);

  // 3. Facilitator article (optional)
  const facilitatorArticle = await generateFacilitatorArticle(existingSlugs);
  if (facilitatorArticle) {
    generated.push(facilitatorArticle);
    console.log(`   ✅ Facilitator article done: ${facilitatorArticle.slug}`);
  }

  // Write to file
  appendToBlogPosts(generated);
  console.log(`\n🎉 Done! Appended ${generated.length} articles to blog-posts.ts`);
  console.log("   Slugs:", generated.map((p) => p.slug).join(", "));
}

main().catch((err) => {
  console.error("\n❌ Content generation failed:", err);
  process.exit(1);
});

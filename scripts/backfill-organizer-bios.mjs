/**
 * Backfill richBio for all organizers that don't have one.
 * Run once: node scripts/backfill-organizer-bios.mjs
 *
 * Uses the same logic as organizer-research.ts but in a standalone script.
 */

import { PrismaClient } from "@prisma/client";
import https from "https";
import http from "http";

const prisma = new PrismaClient();
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
  console.error("Missing DEEPSEEK_API_KEY");
  process.exit(1);
}

async function fetchText(url) {
  return new Promise((resolve) => {
    try {
      const safeUrl = url.startsWith("http") ? url : `https://${url}`;
      const protocol = safeUrl.startsWith("https") ? https : http;
      const req = protocol.get(safeUrl, { timeout: 6000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          resolve(fetchText(res.headers.location ?? ""));
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const text = data
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 4000);
          resolve(text);
        });
      });
      req.on("error", () => resolve(""));
      req.on("timeout", () => { req.destroy(); resolve(""); });
    } catch {
      resolve("");
    }
  });
}

async function callDeepSeek(prompt) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: "deepseek-chat",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const req = https.request(
      {
        hostname: "api.deepseek.com",
        path: "/chat/completions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.choices?.[0]?.message?.content?.trim() ?? "");
          } catch {
            resolve("");
          }
        });
      }
    );
    req.on("error", () => resolve(""));
    req.write(body);
    req.end();
  });
}

const CATEGORY_LABELS = {
  YOGA: "Joga",
  MEDITATION: "Meditacija",
  BREATHWORK: "Dihanje",
  SOUND_HEALING: "Zvočna kopel",
  CACAO: "Kakao ceremonija",
  RETREAT: "Retreat",
  WORKSHOP: "Delavnica",
  DANCE: "Ples",
  TANTRA: "Tantra",
  HEALING: "Zdravljenje",
};

async function generateRichBio(org, categoryLabels) {
  const websiteText = org.website ? await fetchText(org.website) : "";

  const contextParts = [];
  if (org.bio) contextParts.push(`Kratek opis: ${org.bio}`);
  if (org.instagram) contextParts.push(`Instagram: @${org.instagram.replace("@", "")}`);
  if (org.website) contextParts.push(`Spletna stran: ${org.website}`);
  if (org.facebookUrl) contextParts.push(`Facebook: ${org.facebookUrl}`);
  if (websiteText) contextParts.push(`Vsebina spletne strani:\n${websiteText}`);
  if (categoryLabels) contextParts.push(`Področja dela: ${categoryLabels}`);

  const prompt = `Si urednik wellness revije, ki piše profilne članke o facilitatorjih v Sloveniji.
Na podlagi spodnjih podatkov napiši BOGAT, PODROBEN življenjepis v slovenščini o facilitatorju/ici ${org.name}.

PODATKI:
${contextParts.join("\n\n")}

NAVODILA:
- Napiši 4–6 odstavkov v 3. osebi
- Vključi: pot in formacijo (kje se je izobraževal/a, kdo so bili njeni/njegovi učitelji)
- Vključi: filozofijo in pristop k delu
- Vključi: specializacije in edinstvene metode
- Vključi: zakaj je ta oseba posebna in kaj prinaša udeležencem
- Ton: topel, navdihujoč, a faktografski — kot Wikipedija, a bolj osebno
- Dolžina: 250–400 besed
- Če točnih podatkov nimaš, pišeš splošno a verodostojno glede na področje (${categoryLabels})
- NE omenjaj datumov konkretnih dogodkov
- NE dodajaj naslova ali podnaslova — samo čisti proza odstavki`;

  return callDeepSeek(prompt);
}

async function main() {
  const organizers = await prisma.organizer.findMany({
    where: { richBio: null },
    include: { events: { select: { category: true } } },
  });

  console.log(`Found ${organizers.length} organizers without richBio\n`);

  for (const org of organizers) {
    const cats = [...new Set(org.events.map((e) => e.category))];
    const labels = cats.map((c) => CATEGORY_LABELS[c] ?? c).join(", ");

    process.stdout.write(`  ${org.name} (${labels || "—"})... `);

    const richBio = await generateRichBio(org, labels);
    if (!richBio) {
      console.log("✗ failed");
      continue;
    }

    await prisma.organizer.update({
      where: { id: org.id },
      data: { richBio, richBioResearchedAt: new Date() },
    });

    console.log(`✓ (${richBio.split(/\s+/).length} words)`);
    // Rate limit
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

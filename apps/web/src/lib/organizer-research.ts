/**
 * Researches a facilitator/organizer and generates a rich Wikipedia-style biography.
 *
 * Called automatically during event enrichment when an organizer has no richBio
 * or their bio hasn't been updated in 30+ days.
 *
 * Research sources (in order of quality):
 *   1. Organizer's website (if set) — fetched and extracted
 *   2. Existing short bio from the database
 *   3. Social links (Instagram handle, Facebook)
 *   4. Event categories and tags (inferred expertise)
 *   5. DeepSeek knowledge (model knows many Slovenian wellness practitioners)
 */

import { db } from "@/lib/db";
import { CATEGORY_LABEL } from "@/lib/utils";

const DEEPSEEK_API = "https://api.deepseek.com/chat/completions";
const BIO_MAX_AGE_DAYS = 30;

export interface OrganizerResearchInput {
  id: string;
  name: string;
  bio: string | null;
  instagram: string | null;
  website: string | null;
  facebookUrl: string | null;
  richBio: string | null;
  richBioResearchedAt: Date | null;
  eventCategories: string[];
}

async function fetchWebsiteText(url: string): Promise<string> {
  try {
    const safeUrl = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(safeUrl, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "ZavestniDogodki/1.0 (+https://zavestnidogodki.si)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip HTML tags, collapse whitespace, take first 4000 chars
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  } catch {
    return "";
  }
}

async function callDeepSeekForBio(prompt: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch(DEEPSEEK_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "";
    return raw.replace(/```[\w]*\s*/g, "").replace(/```\s*/g, "").trim();
  } catch {
    return "";
  }
}

export function needsResearch(organizer: Pick<OrganizerResearchInput, "richBio" | "richBioResearchedAt">): boolean {
  if (!organizer.richBio) return true;
  if (!organizer.richBioResearchedAt) return true;
  const ageMs = Date.now() - organizer.richBioResearchedAt.getTime();
  return ageMs > BIO_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

export async function researchAndSaveOrganizer(organizer: OrganizerResearchInput): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return organizer.richBio ?? organizer.bio ?? "";

  // Gather research context
  const websiteText = organizer.website ? await fetchWebsiteText(organizer.website) : "";
  const categoryLabels = [...new Set(organizer.eventCategories)]
    .map((c) => CATEGORY_LABEL[c] ?? c)
    .join(", ");

  const contextParts: string[] = [];
  if (organizer.bio) contextParts.push(`Kratek opis iz baze: ${organizer.bio}`);
  if (organizer.instagram) contextParts.push(`Instagram: @${organizer.instagram.replace("@", "")}`);
  if (organizer.website) contextParts.push(`Spletna stran: ${organizer.website}`);
  if (organizer.facebookUrl) contextParts.push(`Facebook: ${organizer.facebookUrl}`);
  if (websiteText) contextParts.push(`Vsebina spletne strani:\n${websiteText}`);
  if (categoryLabels) contextParts.push(`Področja dela: ${categoryLabels}`);

  const prompt = `Si urednik wellness revije, ki piše profilne članke o facilitatorjih v Sloveniji.
Na podlagi spodnjih podatkov napiši BOGAT, PODROBEN življenjepis v slovenščini o facilitatorju/ici ${organizer.name}.

PODATKI:
${contextParts.join("\n\n")}

NAVODILA:
- Napiši 4–6 odstavkov v 3. osebi (primer: "${organizer.name} je ...", "Njeno/Njegovo delo ...")
- Vključi: pot in formacijo (kje se je izobraževal/a, kdo so bili njeni/njegovi učitelji)
- Vključi: filozofijo in pristop k delu
- Vključi: specializacije in edinstvene metode
- Vključi: zakaj je ta oseba posebna in kaj prinaša udeležencem
- Ton: topel, navdihujoč, a faktografski — kot Wikipedija, a bolj osebno
- Dolžina: 250–400 besed
- Če točnih podatkov nimaš, pišeš splošno a verodostojno glede na področje (${categoryLabels})
- NE omenjaj datumov konkretnih dogodkov
- NE dodajaj naslova ali podnaslova — samo čisti proza odstavki`;

  const richBio = await callDeepSeekForBio(prompt, apiKey);
  if (!richBio) return organizer.richBio ?? organizer.bio ?? "";

  // Persist asynchronously (fire-and-forget style — don't block page render)
  db.organizer
    .update({
      where: { id: organizer.id },
      data: { richBio, richBioResearchedAt: new Date() },
    })
    .catch((err: unknown) => console.error("[organizer-research] save failed:", err));

  return richBio;
}

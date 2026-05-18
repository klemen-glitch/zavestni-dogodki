/**
 * Smart chat endpoint — backed by live event data from DB.
 * Detects category + city intent from user message, queries matching
 * upcoming events, and injects them as context before calling Claude.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── keyword maps ──────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  YOGA:           ["joga", "yoga", "hatha", "vinyasa", "yin"],
  MEDITATION:     ["meditacij", "meditacija", "mindfulness", "mindfulnes", "zavestnost"],
  BREATHWORK:     ["breathwork", "dihanje", "dihalne", "holotropno", "pranayama", "wim hof"],
  SOUND_BATH:     ["zvočna kopel", "zvocna kopel", "gong", "tibetanska", "kristalne posode", "sound bath", "zvočno"],
  CACAO_CEREMONY: ["kakao", "cacao", "ceremonija", "kakao ceremonija"],
  RETREAT:        ["retreat", "odmik", "vikend odmik", "tišina"],
  WORKSHOP:       ["delavnica", "workshop", "seminar", "tečaj", "tecaj", "izobraževanje"],
  DANCE:          ["ples", "plesni", "ecstatic", "ecstatic dance", "gibanje"],
  TANTRA:         ["tantra", "tantri", "tantričen"],
  HEALING:        ["zdravljenje", "reiki", "zdravilni", "energijsko", "celostno"],
};

const CITY_KEYWORDS: Record<string, string[]> = {
  Ljubljana:  ["ljubljana", "lj", "ljubljan"],
  Maribor:    ["maribor", "mb"],
  Koper:      ["koper", "kopru"],
  Celje:      ["celje"],
  Kranj:      ["kranj"],
  Bled:       ["bled"],
  Piran:      ["piran"],
  "Nova Gorica": ["nova gorica", "gorica"],
  "Novo Mesto":  ["novo mesto"],
  Bohinj:     ["bohinj"],
};

const TIME_KEYWORDS: Record<string, number> = {
  "danes":        0,
  "jutri":        1,
  "ta teden":     7,
  "ta mesec":     30,
  "ta vikend":    3,
  "prihodnji":    14,
  "naslednji":    14,
};

function detectCategories(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(CATEGORY_KEYWORDS)
    .filter(([, kws]) => kws.some((kw) => lower.includes(kw)))
    .map(([cat]) => cat);
}

function detectCities(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(CITY_KEYWORDS)
    .filter(([, kws]) => kws.some((kw) => lower.includes(kw)))
    .map(([city]) => city);
}

function detectTimeWindow(text: string): number {
  const lower = text.toLowerCase();
  for (const [kw, days] of Object.entries(TIME_KEYWORDS)) {
    if (lower.includes(kw)) return days;
  }
  return 30; // default: next 30 days
}

function isEventQuery(text: string): boolean {
  const lower = text.toLowerCase();
  const triggers = [
    "kdaj", "kje", "kateri", "kaj", "poka", "najdi", "iščem", "išče", "išči",
    "priporoč", "predlagaj", "events", "dogodki", "delavnic", "retreat",
    "ta teden", "ta mesec", "danes", "jutri", "vikend", "prihodnji",
    ...Object.values(CATEGORY_KEYWORDS).flat(),
    ...Object.values(CITY_KEYWORDS).flat(),
  ];
  return triggers.some((t) => lower.includes(t));
}

// ── format events for injection ───────────────────────────────────────────────

function formatEventsForContext(events: Array<{
  titleSl: string | null; titleEn: string; date: Date; category: string;
  price: number | null; priceNote: string | null; slug: string | null; id: string;
  venueName: string | null; venue: { name: string; city: string } | null;
  organizer: { name: string } | null;
}>): string {
  if (events.length === 0) return "(Ni ujemajočih se dogodkov za ta filter.)";

  return events.map((e, i) => {
    const title = e.titleSl ?? e.titleEn;
    const date = new Date(e.date).toLocaleDateString("sl-SI", {
      weekday: "long", day: "numeric", month: "long",
      timeZone: "Europe/Ljubljana",
    });
    const time = new Date(e.date).toLocaleTimeString("sl-SI", {
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Ljubljana",
    });
    const city = e.venue?.city ?? e.venueName?.split(",").pop()?.trim() ?? "—";
    const venue = e.venue?.name ?? e.venueName ?? "";
    const price = e.price != null
      ? (e.price === 0 ? "Brezplačno" : `${e.price}€${e.priceNote ? ` (${e.priceNote})` : ""}`)
      : "Cena ni določena";
    const facilitator = e.organizer?.name ?? "";
    const url = `/events/${e.slug ?? e.id}`;

    return `${i + 1}. **${title}**
   📅 ${date} ob ${time}
   📍 ${city}${venue && venue !== city ? ` — ${venue}` : ""}
   💶 ${price}${facilitator ? `\n   👤 ${facilitator}` : ""}
   🔗 ${url}`;
  }).join("\n\n");
}

// ── main handler ──────────────────────────────────────────────────────────────

interface Message { role: "user" | "assistant"; content: string; }

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: "Oprostite, pomočnik trenutno ni na voljo." });
  }

  let body: { messages?: Message[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const messages = (body.messages ?? []).slice(-8);
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // ── Query DB for relevant events ──────────────────────────────────────────
  let eventContext = "";

  if (isEventQuery(lastUserMessage)) {
    const categories = detectCategories(lastUserMessage);
    const cities = detectCities(lastUserMessage);
    const days = detectTimeWindow(lastUserMessage);

    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    try {
      const events = await db.event.findMany({
        where: {
          status: { in: ["APPROVED", "FEATURED"] },
          date: { gte: now, lte: until },
          ...(categories.length > 0 && { category: { in: categories as never[] } }),
          ...(cities.length > 0 && {
            OR: [
              { venue: { city: { in: cities } } },
              { venueName: { contains: cities[0], mode: "insensitive" } },
            ],
          }),
        },
        orderBy: [{ featured: "desc" }, { date: "asc" }],
        take: 6,
        include: { venue: true, organizer: { select: { name: true } } },
      });

      // Fallback: if no matches with filters, get next 5 upcoming events
      const effectiveEvents = events.length > 0 ? events : await db.event.findMany({
        where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: now } },
        orderBy: [{ featured: "desc" }, { date: "asc" }],
        take: 5,
        include: { venue: true, organizer: { select: { name: true } } },
      });

      eventContext = `\n\n---\n📋 DEJANSKI PRIHAJAJOČI DOGODKI IZ BAZE (${new Date().toLocaleDateString("sl-SI")}):\n${formatEventsForContext(effectiveEvents)}\n\nFilteri iskanja: ${categories.length > 0 ? categories.join(", ") : "vse kategorije"} | ${cities.length > 0 ? cities.join(", ") : "vsa mesta"} | naslednjih ${days} dni\n---`;
    } catch {
      // DB query failed — continue without event context
    }
  }

  const systemPrompt = `Si prijazen pomočnik platforme Zavestni Dogodki — prvega kuricanega imenika zavestnih, duhovnih in wellness dogodkov v Sloveniji.

TVOJA VLOGA:
- Pomagaš obiskovalcem najti prave dogodke na podlagi DEJANSKIH podatkov iz baze
- Odgovarjaš na vprašanja o platformi, oddaji dogodkov in zavestnih praksah
- Ko ti je na voljo seznam dejanskih dogodkov, jih VEDNO omeni (naslov, datum, mesto, cena)
- Ko pošlješ link do dogodka, ga vpiši kot: zavestnidogodki.si/events/[slug]
- Pišeš V SLOVENŠČINI (razen če te vprašajo drugače)

PLATFORMA:
- Brezplačen imenik za iskanje zavestnih dogodkov
- Facilitatorji oddajo dogodek BREZPLAČNO na /submit
- Filtri: kategorija, mesto, datum, cena

SLOG:
- Topel, prijazni, 2–4 stavki + seznam dogodkov ko je relevantno
- Emoji za živahnost 🌿 (zmerno)
- NIKOLI ne izmišljaj podatkov — vedno temelji na spodnjem seznamu${eventContext}`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ reply: "Oprostite, prišlo je do napake. Poskusite znova." });
    }

    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const reply = data.choices?.[0]?.message?.content ?? "Oprostite, ne razumem. Poskusite znova.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "Oprostite, prišlo je do napake. Poskusite znova." });
  }
}

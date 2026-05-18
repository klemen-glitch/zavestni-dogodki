/**
 * POST /api/admin/newsletter/send-personalised
 * Sends a personalised weekly newsletter to each active subscriber based on
 * their category preferences and preferred cities.
 *
 * Body: { dryRun?: boolean, testEmail?: string, weekOffset?: number }
 * Returns: { sent, skipped, failed, segments, details }
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// ── auth ──────────────────────────────────────────────────────────────────────
function requireAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  return (
    req.headers.get("x-admin-secret") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`
  );
}

// ── constants ─────────────────────────────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  YOGA: "🧘", MEDITATION: "🌀", BREATHWORK: "💨", SOUND_BATH: "🎵",
  CACAO_CEREMONY: "🍫", RETREAT: "🏕️", WORKSHOP: "✨", DANCE: "💃",
  TANTRA: "🌹", HEALING: "🌿", OTHER: "🌸",
};

const CATEGORY_LABEL: Record<string, string> = {
  YOGA: "Joga", MEDITATION: "Meditacija", BREATHWORK: "Breathwork",
  SOUND_BATH: "Zvočna kopel", CACAO_CEREMONY: "Kakao ceremonija",
  RETREAT: "Retreat", WORKSHOP: "Delavnica", DANCE: "Ples",
  TANTRA: "Tantra", HEALING: "Zdravljenje", OTHER: "Ostalo",
};

const CATEGORY_COLOR: Record<string, string> = {
  YOGA: "#059669", MEDITATION: "#7c3aed", BREATHWORK: "#0284c7",
  SOUND_BATH: "#d97706", CACAO_CEREMONY: "#ea580c", RETREAT: "#0d9488",
  WORKSHOP: "#4f46e5", DANCE: "#db2777", TANTRA: "#e11d48", HEALING: "#65a30d",
  OTHER: "#57534e",
};

// ── email template ────────────────────────────────────────────────────────────

interface EventRow {
  id: string;
  slug: string | null;
  titleSl: string | null;
  titleEn: string;
  date: Date;
  category: string;
  price: number | null;
  priceNote: string | null;
  venueName: string | null;
  imageUrl: string | null;
  venue: { name: string; city: string } | null;
}

function buildPersonalisedHtml(opts: {
  firstName: string | null;
  email: string;
  events: EventRow[];
  preferredCategories: string[];
  preferredCities: string[];
  allEventsCount: number;
  appUrl: string;
}): string {
  const { firstName, email, events, preferredCategories, preferredCities, appUrl } = opts;
  const name = firstName ? `, ${firstName}` : "";

  const dateStr = new Date().toLocaleDateString("sl-SI", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Build the pref context line
  const catLabels = preferredCategories.map((c) => CATEGORY_LABEL[c] ?? c);
  const prefLine = [
    catLabels.length > 0 ? catLabels.join(", ") : null,
    preferredCities.length > 0 ? preferredCities.join(", ") : null,
  ].filter(Boolean).join(" · ");

  const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
  const prefsUrl = `${appUrl}/preferences?email=${encodeURIComponent(email)}`;

  function eventCard(e: EventRow) {
    const url = `${appUrl}/events/${e.slug ?? e.id}`;
    const title = e.titleSl ?? e.titleEn;
    const catColor = CATEGORY_COLOR[e.category] ?? "#57534e";
    const catEmoji = CATEGORY_EMOJI[e.category] ?? "🌸";
    const catLabel = CATEGORY_LABEL[e.category] ?? e.category;
    const city = e.venue?.city ?? (e.venueName ? e.venueName.split(",").pop()?.trim() : null) ?? "";
    const dateLabel = new Date(e.date).toLocaleDateString("sl-SI", {
      weekday: "short", day: "numeric", month: "short",
      timeZone: "Europe/Ljubljana",
    });
    const timeLabel = new Date(e.date).toLocaleTimeString("sl-SI", {
      hour: "2-digit", minute: "2-digit",
      timeZone: "Europe/Ljubljana",
    });
    const priceLabel = e.price != null
      ? `${e.price === 0 ? "Brezplačno" : `${e.price}€`}${e.priceNote ? ` · ${e.priceNote}` : ""}`
      : "Cena ni določena";

    return `
    <tr>
      <td style="padding:0 0 16px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#fff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr>
            ${e.imageUrl ? `
            <td width="96" style="padding:0;vertical-align:top;">
              <img src="${e.imageUrl}" alt="${title}" width="96" height="96"
                style="display:block;width:96px;height:96px;object-fit:cover;border-radius:12px 0 0 12px;" />
            </td>` : ""}
            <td style="padding:14px 16px;vertical-align:top;">
              <p style="margin:0 0 4px;">
                <span style="font-size:11px;font-weight:700;color:${catColor};text-transform:uppercase;letter-spacing:0.05em;">
                  ${catEmoji} ${catLabel}${city ? ` · 📍 ${city}` : ""}
                </span>
              </p>
              <a href="${url}" style="display:block;color:#1c1917;font-size:15px;font-weight:700;text-decoration:none;line-height:1.4;margin-bottom:6px;">
                ${title}
              </a>
              <p style="margin:0;font-size:12px;color:#78716c;">
                📅 ${dateLabel} ob ${timeLabel} &nbsp;·&nbsp; 💶 ${priceLabel}
              </p>
              <a href="${url}" style="display:inline-block;margin-top:10px;padding:7px 14px;background:${catColor};color:#fff;border-radius:999px;font-size:11px;font-weight:700;text-decoration:none;">
                Več info →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Zavestni dogodki ta teden</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f4;padding:32px 16px;">
  <tr>
    <td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2d6a4f,#1b4332);border-radius:20px 20px 0 0;padding:36px 40px 32px;">
            <p style="margin:0 0 8px;color:#74c69d;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
              Zavestni Dogodki · ${dateStr}
            </p>
            <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;line-height:1.3;">
              Vaši zavestni dogodki ta teden${name} 🌿
            </h1>
            ${prefLine ? `
            <p style="margin:0;color:#a7f3d0;font-size:13px;">
              Na podlagi vaših interesov: <strong>${prefLine}</strong>
            </p>` : ""}
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px 40px;">

            ${events.length === 0 ? `
            <p style="color:#44403c;font-size:15px;line-height:1.7;margin:0 0 20px;">
              Tokrat ni novih dogodkov, ki bi ustrezali vašim preferencam.
              Oglejte si <a href="${appUrl}/events" style="color:#2d6a4f;font-weight:600;">vse prihajajoče dogodke</a>.
            </p>
            ` : `
            <p style="color:#44403c;font-size:14px;line-height:1.7;margin:0 0 20px;">
              Za vas smo izbrali ${events.length} ${events.length === 1 ? "dogodek" : events.length < 5 ? "dogodke" : "dogodkov"} —
              samo tisti, ki ustrezajo vašim preferencam.
            </p>

            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              ${events.map(eventCard).join("")}
            </table>
            `}

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
              <tr>
                <td align="center" style="padding:20px;background:#f0fdf4;border-radius:12px;">
                  <a href="${appUrl}/events" style="display:inline-block;padding:12px 28px;background:#2d6a4f;color:#fff;border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;">
                    Vsi dogodki →
                  </a>
                  <p style="margin:12px 0 0;font-size:12px;color:#6b7280;">
                    <a href="${prefsUrl}" style="color:#2d6a4f;">Spremenite preference</a>
                    &nbsp;·&nbsp;
                    <a href="${unsubUrl}" style="color:#9ca3af;">Odjava</a>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#fafaf9;border-top:1px solid #e7e5e4;border-radius:0 0 20px 20px;padding:20px 40px;">
            <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.6;">
              Zavestni Dogodki · zavestnidogodki.si<br>
              Prejemate ker ste se naročili na <strong>${email}</strong>.<br>
              <a href="${unsubUrl}" style="color:#a8a29e;">Odjava</a> · <a href="${prefsUrl}" style="color:#a8a29e;">Spremenite preference</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ── main handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun === true;
  const testEmail = body.testEmail as string | undefined;
  const weekOffset = typeof body.weekOffset === "number" ? body.weekOffset : 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const from = process.env.EMAIL_FROM ?? "Zavestni Dogodki <noreply@zavestnidogodki.si>";

  // Fetch all active subscribers
  const subscribers = await db.subscriber.findMany({
    where: { active: true },
    select: {
      id: true, email: true, firstName: true,
      preferences: true, cities: true,
    },
  });

  // Fetch upcoming events (next 2 weeks)
  const now = new Date();
  const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + weekOffset * 7 * 24 * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000);

  const allEvents = await db.event.findMany({
    where: {
      status: { in: ["APPROVED", "FEATURED"] },
      date: { gte: windowStart, lte: twoWeeksOut },
    },
    orderBy: [{ featured: "desc" }, { date: "asc" }],
    include: { venue: { select: { name: true, city: true } } },
    take: 50,
  });

  // Segment stats
  const segments = new Map<string, number>();
  const results: { email: string; eventCount: number; sent: boolean; error?: string }[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Determine the target: all subscribers or just testEmail
  const targets = testEmail
    ? [{ id: "test", email: testEmail, firstName: "Test", preferences: [], cities: [] }]
    : subscribers;

  for (const sub of targets) {
    // Filter events for this subscriber
    let matchedEvents = allEvents;

    const hasPrefs = sub.preferences.length > 0;
    const hasCities = sub.cities.length > 0;

    if (hasPrefs || hasCities) {
      matchedEvents = allEvents.filter((e) => {
        const catMatch = !hasPrefs || sub.preferences.includes(e.category as never);
        const cityMatch = !hasCities || sub.cities.some((c) =>
          (e.venue?.city ?? e.venueName ?? "").toLowerCase().includes(c.toLowerCase())
        );
        return catMatch && cityMatch;
      });

      // Fallback: if preferences set but no matches, show top general events
      if (matchedEvents.length === 0 && hasPrefs) {
        matchedEvents = allEvents.slice(0, 4);
      }
    }

    // Limit to top 6 events
    const eventsForEmail = matchedEvents.slice(0, 6);

    // Track segment key for analytics
    const segKey = `cats:${sub.preferences.sort().join(",")}|cities:${sub.cities.sort().join(",")}`;
    segments.set(segKey, (segments.get(segKey) ?? 0) + 1);

    if (dryRun) {
      results.push({ email: sub.email, eventCount: eventsForEmail.length, sent: false });
      skipped++;
      continue;
    }

    const html = buildPersonalisedHtml({
      firstName: sub.firstName,
      email: sub.email,
      events: eventsForEmail,
      preferredCategories: sub.preferences as string[],
      preferredCities: sub.cities,
      allEventsCount: allEvents.length,
      appUrl,
    });

    const subject = `🌿 Vaši zavestni dogodki — ${new Date(windowStart).toLocaleDateString("sl-SI", { day: "numeric", month: "long" })}`;

    if (!apiKey) {
      // No Resend key — log and skip
      console.log(`[personalised-newsletter] No RESEND_API_KEY — would send to ${sub.email} (${eventsForEmail.length} events)`);
      results.push({ email: sub.email, eventCount: eventsForEmail.length, sent: false, error: "RESEND_API_KEY not set" });
      skipped++;
      continue;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [sub.email], subject, html }),
      });

      if (res.ok) {
        results.push({ email: sub.email, eventCount: eventsForEmail.length, sent: true });
        sent++;
      } else {
        const err = await res.text();
        results.push({ email: sub.email, eventCount: eventsForEmail.length, sent: false, error: err });
        failed++;
      }

      // Respect Resend rate limit (100 req/s on free tier)
      await new Promise((r) => setTimeout(r, 50));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ email: sub.email, eventCount: eventsForEmail.length, sent: false, error: msg });
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    totalSubscribers: subscribers.length,
    totalEvents: allEvents.length,
    sent,
    skipped,
    failed,
    segments: Array.from(segments.entries()).map(([key, count]) => ({ key, count })),
    details: results.slice(0, 50), // cap to avoid huge response
  });
}

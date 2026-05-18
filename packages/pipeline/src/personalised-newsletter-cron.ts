import "dotenv/config";
import { prisma } from "@conscious-slovenia/database";

/**
 * Personalised newsletter cron job.
 *
 * For each active subscriber that has category or city preferences,
 * find matching upcoming events (next 14 days) and send a tailored email.
 * Subscribers with NO preferences receive only the generic Beehiiv newsletter.
 *
 * Fire from GitHub Actions every Sunday alongside the generic newsletter.
 */

const CATEGORY_LABEL: Record<string, string> = {
  YOGA: "Joga", MEDITATION: "Meditacija", BREATHWORK: "Breathwork",
  SOUND_BATH: "Zvočna kopel", CACAO_CEREMONY: "Kakao ceremonija",
  RETREAT: "Retreat", WORKSHOP: "Delavnica", DANCE: "Ples",
  TANTRA: "Tantra", HEALING: "Zdravljenje", OTHER: "Ostalo",
};

const CATEGORY_EMOJI: Record<string, string> = {
  YOGA: "🧘", MEDITATION: "🌀", BREATHWORK: "💨", SOUND_BATH: "🎵",
  CACAO_CEREMONY: "🍫", RETREAT: "🏕️", WORKSHOP: "✨", DANCE: "💃",
  TANTRA: "🌹", HEALING: "🌿", OTHER: "🌸",
};

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildPersonalisedHtml(opts: {
  firstName: string | null;
  email: string;
  events: Array<{
    titleSl: string | null; titleEn: string; date: Date;
    category: string; price: number | null; priceNote: string | null;
    slug: string | null; id: string; imageUrl: string | null;
    venueName: string | null; venue: { name: string; city: string } | null;
    organizer: { name: string } | null;
  }>;
  appUrl: string;
  prefContext: string;  // e.g. "Joga, Meditacija · Ljubljana"
}): string {
  const { firstName, email, events, appUrl, prefContext } = opts;
  const greeting = firstName ? `Pozdravljeni${firstName ? `, ${firstName}` : ""}! 👋` : "Pozdravljeni! 👋";
  const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
  const prefsUrl = `${appUrl}/preferences?email=${encodeURIComponent(email)}`;

  const eventCards = events.map((e) => {
    const title = e.titleSl ?? e.titleEn;
    const date = e.date.toLocaleDateString("sl-SI", {
      weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Ljubljana",
    });
    const time = e.date.toLocaleTimeString("sl-SI", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Ljubljana",
    });
    const city = e.venue?.city ?? e.venueName?.split(",").pop()?.trim() ?? "";
    const venue = e.venue?.name ?? e.venueName ?? "";
    const price = e.price != null
      ? (e.price === 0 ? "Brezplačno" : `${e.price}€${e.priceNote ? ` (${e.priceNote})` : ""}`)
      : "";
    const catEmoji = CATEGORY_EMOJI[e.category] ?? "🌸";
    const catLabel = CATEGORY_LABEL[e.category] ?? e.category;
    const url = `${appUrl}/events/${e.slug ?? e.id}`;

    return `
    <tr><td style="padding:0 0 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
        style="background:#fff;border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;">
        ${e.imageUrl ? `
        <tr><td>
          <img src="${e.imageUrl}" alt="${title}" width="480" height="160"
            style="display:block;width:100%;height:160px;object-fit:cover;object-position:center 20%;" />
        </td></tr>` : ""}
        <tr><td style="padding:16px 20px 20px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.05em;">
            ${catEmoji} ${catLabel}${city ? ` · 📍 ${city}` : ""}
          </p>
          <h3 style="margin:0 0 10px;color:#1c1917;font-size:17px;font-weight:700;line-height:1.3;">
            ${title}
          </h3>
          <p style="margin:0 0 10px;color:#78716c;font-size:13px;line-height:1.5;">
            📅 ${date} ob ${time}
            ${venue && venue !== city ? `<br>📌 ${venue}` : ""}
            ${price ? `<br>💶 ${price}` : ""}
            ${e.organizer?.name ? `<br>👤 ${e.organizer.name}` : ""}
          </p>
          <a href="${url}"
            style="display:inline-block;padding:9px 18px;background:#2d6a4f;color:#fff;
                   border-radius:999px;font-size:13px;font-weight:700;text-decoration:none;">
            Oglejte si →
          </a>
        </td></tr>
      </table>
    </td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="sl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f4;padding:24px 16px;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#2d6a4f,#1b4332);border-radius:16px 16px 0 0;padding:28px 32px 24px;">
    <p style="margin:0 0 4px;color:#74c69d;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
      Zavestni Dogodki — Tedenski pregled
    </p>
    <h1 style="margin:0 0 8px;color:#fff;font-size:22px;font-weight:800;line-height:1.3;">
      ${greeting}
    </h1>
    ${prefContext ? `<p style="margin:0;color:#a7f3d0;font-size:12px;">Vaše preference: ${prefContext}</p>` : ""}
  </td></tr>

  <!-- Intro -->
  <tr><td style="background:#fff;padding:20px 32px 4px;">
    <p style="margin:0;color:#57534e;font-size:14px;line-height:1.6;">
      Za vas smo izbrali zavestne dogodke, ki ustrezajo vašim interesom v naslednjih
      dveh tednih. ${events.length === 1 ? "Najden 1 ustrezen dogodek." : `Najdenih ${events.length} ustreznih dogodkov.`}
    </p>
  </td></tr>

  <!-- Event cards -->
  <tr><td style="background:#fff;padding:16px 32px 24px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      ${eventCards}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="background:#f0fdf4;padding:20px 32px;border-top:1px solid #bbf7d0;">
    <p style="margin:0 0 12px;font-size:13px;color:#15803d;font-weight:600;">
      🔍 Poiščite še več dogodkov
    </p>
    <a href="${appUrl}/events"
      style="display:inline-block;padding:10px 20px;border:2px solid #2d6a4f;color:#2d6a4f;
             border-radius:999px;font-size:13px;font-weight:700;text-decoration:none;">
      Vsi zavestni dogodki →
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#fafaf9;border-top:1px solid #e7e5e4;border-radius:0 0 16px 16px;padding:16px 32px;">
    <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.6;">
      Prejeli ste ta email ker ste naročeni na Zavestni Dogodki.<br>
      <a href="${unsubUrl}" style="color:#a8a29e;">Odjava</a> ·
      <a href="${prefsUrl}" style="color:#a8a29e;">Spremenite preference</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runPersonalisedNewsletter(opts: {
  dryRun?: boolean;
  testEmail?: string;
  daysAhead?: number;
} = {}): Promise<void> {
  const { dryRun = false, testEmail, daysAhead = 14 } = opts;

  const resendKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const from = process.env.EMAIL_FROM ?? "Zavestni Dogodki <noreply@zavestnidogodki.si>";

  console.log(`\n✉️  Personalised newsletter run (dryRun=${dryRun}, daysAhead=${daysAhead})`);

  if (!resendKey && !dryRun) {
    console.log("⚠️  RESEND_API_KEY not set — aborting live send");
    return;
  }

  // ── Fetch events ────────────────────────────────────────────────────────────
  const now = new Date();
  const until = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      status: { in: ["APPROVED", "FEATURED"] },
      date: { gte: now, lte: until },
    },
    orderBy: [{ featured: "desc" }, { date: "asc" }],
    include: {
      venue: true,
      organizer: { select: { name: true } },
    },
  });

  if (events.length === 0) {
    console.log("⚠️  No upcoming events in the next 14 days — skipping.");
    return;
  }

  console.log(`📋 ${events.length} upcoming events found`);

  // ── Fetch subscribers ───────────────────────────────────────────────────────
  const allSubscribers = await prisma.subscriber.findMany({
    where: { active: true },
    select: { id: true, email: true, firstName: true, preferences: true, cities: true },
  });

  // Only send to subscribers who have at least one preference or city set
  const subscribers = testEmail
    ? allSubscribers.filter((s) => s.email === testEmail)
    : allSubscribers.filter((s) => s.preferences.length > 0 || s.cities.length > 0);

  console.log(`👥 ${subscribers.length} subscribers with preferences (of ${allSubscribers.length} total)`);

  if (subscribers.length === 0) {
    console.log("No subscribers with preferences — nothing to send.");
    return;
  }

  let sent = 0, skipped = 0, failed = 0;

  for (const sub of subscribers) {
    // Match events to this subscriber
    const matched = events.filter((e) => {
      const hasPrefs = sub.preferences.length > 0;
      const hasCities = sub.cities.length > 0;
      const eventCity = e.venue?.city ?? e.venueName?.split(",").pop()?.trim() ?? "";

      const catMatch = !hasPrefs || sub.preferences.includes(e.category as never);
      const cityMatch = !hasCities || sub.cities.some((c) =>
        eventCity.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(eventCity.toLowerCase())
      );

      return catMatch && cityMatch;
    }).slice(0, 5); // cap at 5 events per email

    if (matched.length === 0) {
      skipped++;
      continue;
    }

    const prefContext = [
      sub.preferences.map((p) => CATEGORY_LABEL[p] ?? p).join(", "),
      sub.cities.join(", "),
    ].filter(Boolean).join(" · ");

    const html = buildPersonalisedHtml({
      firstName: sub.firstName,
      email: sub.email,
      events: matched,
      appUrl,
      prefContext,
    });

    const subject = `🌿 Vaši zavestni dogodki — ${matched.length} ${matched.length === 1 ? "event" : "eventi"} za vas`;

    if (dryRun) {
      console.log(`  [DRY] Would send to ${sub.email}: ${matched.length} events matched`);
      sent++;
      continue;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [sub.email], subject, html }),
      });

      if (res.ok) {
        sent++;
        console.log(`  ✅ Sent to ${sub.email} (${matched.length} events)`);
      } else {
        failed++;
        console.warn(`  ⚠️  Failed for ${sub.email}: ${res.status}`);
      }
    } catch (err) {
      failed++;
      console.warn(`  ⚠️  Error for ${sub.email}:`, err);
    }

    // Stay within Resend rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n✅ Personalised newsletter done — sent:${sent} skipped:${skipped} failed:${failed}\n`);
}

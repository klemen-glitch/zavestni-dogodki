/**
 * Instant subscriber alerts — fired after each pipeline run.
 * For each newly approved event, check if any active subscriber has
 * matching category/city preferences and hasn't been alerted about this
 * exact event yet. Send a personalised email immediately via Resend.
 *
 * Fire-and-forget — never throws.
 */

import { prisma } from "@conscious-slovenia/database";

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

function buildAlertHtml(opts: {
  firstName: string | null;
  eventTitle: string;
  eventDate: Date;
  eventCategory: string;
  eventCity: string;
  eventPrice: number | null;
  eventSlug: string;
  eventImageUrl: string | null;
  appUrl: string;
  email: string;
}): string {
  const { firstName, eventTitle, eventDate, eventCategory, eventCity,
          eventPrice, eventSlug, eventImageUrl, appUrl, email } = opts;

  const name = firstName ? `, ${firstName}` : "";
  const dateStr = eventDate.toLocaleDateString("sl-SI", {
    weekday: "long", day: "numeric", month: "long",
    timeZone: "Europe/Ljubljana",
  });
  const timeStr = eventDate.toLocaleTimeString("sl-SI", {
    hour: "2-digit", minute: "2-digit",
    timeZone: "Europe/Ljubljana",
  });
  const priceStr = eventPrice != null
    ? (eventPrice === 0 ? "Brezplačno" : `${eventPrice}€`)
    : "";
  const catLabel = CATEGORY_LABEL[eventCategory] ?? eventCategory;
  const catEmoji = CATEGORY_EMOJI[eventCategory] ?? "🌸";
  const eventUrl = `${appUrl}/events/${eventSlug}`;
  const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(email)}`;

  return `<!DOCTYPE html>
<html lang="sl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f4;padding:24px 16px;">
  <tr><td align="center">
  <table cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;width:100%;">

    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#2d6a4f,#1b4332);border-radius:16px 16px 0 0;padding:28px 32px 24px;">
      <p style="margin:0 0 6px;color:#74c69d;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
        Novo ujemanje • Zavestni Dogodki
      </p>
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;line-height:1.3;">
        Nov zavestni dogodek za vas${name}! ${catEmoji}
      </h1>
    </td></tr>

    <!-- Event card -->
    <tr><td style="background:#fff;padding:0;">
      ${eventImageUrl ? `
      <img src="${eventImageUrl}" alt="${eventTitle}" width="520" height="200"
        style="display:block;width:100%;height:200px;object-fit:cover;object-position:center 30%;" />` : ""}
      <div style="padding:24px 32px 28px;">
        <p style="margin:0 0 4px;">
          <span style="font-size:11px;font-weight:700;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.05em;">
            ${catEmoji} ${catLabel}${eventCity ? ` · 📍 ${eventCity}` : ""}
          </span>
        </p>
        <h2 style="margin:6px 0 16px;color:#1c1917;font-size:20px;font-weight:700;line-height:1.3;">
          ${eventTitle}
        </h2>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
          <tr>
            <td style="padding:0 24px 0 0;color:#78716c;font-size:13px;">
              📅 ${dateStr}<br>
              <span style="color:#44403c;font-weight:600;">ob ${timeStr}</span>
            </td>
            ${priceStr ? `<td style="color:#78716c;font-size:13px;">
              💶 ${priceStr}
            </td>` : ""}
          </tr>
        </table>
        <a href="${eventUrl}" style="display:inline-block;padding:12px 24px;background:#2d6a4f;color:#fff;border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;">
          Oglejte si dogodek →
        </a>
      </div>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#fafaf9;border-top:1px solid #e7e5e4;border-radius:0 0 16px 16px;padding:16px 32px;">
      <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.6;">
        Prejeli ste ta email ker ste naročeni na Zavestni Dogodki.<br>
        <a href="${unsubUrl}" style="color:#a8a29e;">Odjava</a> ·
        <a href="${appUrl}/preferences?email=${encodeURIComponent(email)}" style="color:#a8a29e;">Spremenite preference</a>
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendSubscriberAlerts(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;

  const resendKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const from = process.env.EMAIL_FROM ?? "Zavestni Dogodki <noreply@zavestnidogodki.si>";

  if (!resendKey) {
    console.log("[subscriber-alerts] RESEND_API_KEY not set — skipping instant alerts");
    return;
  }

  // Fetch the new events
  const events = await prisma.event.findMany({
    where: { id: { in: eventIds }, status: { in: ["APPROVED", "FEATURED"] } },
    include: { venue: true },
  });

  if (events.length === 0) return;

  // Fetch active subscribers with preferences
  const subscribers = await prisma.subscriber.findMany({
    where: { active: true },
    select: { id: true, email: true, firstName: true, preferences: true, cities: true },
  });

  if (subscribers.length === 0) return;

  let alertsSent = 0;

  for (const event of events) {
    const eventCity = event.venue?.city ?? event.venueName?.split(",").pop()?.trim() ?? "";

    // Find subscribers who have a matching preference for this event
    const matchingSubscribers = subscribers.filter((sub) => {
      const hasPrefs = sub.preferences.length > 0;
      const hasCities = sub.cities.length > 0;

      // If subscriber has no preferences at all — don't send instant alerts (they get weekly)
      if (!hasPrefs && !hasCities) return false;

      const catMatch = !hasPrefs || sub.preferences.includes(event.category as never);
      const cityMatch = !hasCities || sub.cities.some((c) =>
        eventCity.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(eventCity.toLowerCase())
      );

      return catMatch && cityMatch;
    });

    if (matchingSubscribers.length === 0) continue;

    const eventSlug = event.slug ?? event.id;
    const subject = `🌿 Nov ${CATEGORY_LABEL[event.category] ?? "zavestni"} dogodek: ${event.titleSl ?? event.titleEn}`;

    for (const sub of matchingSubscribers) {
      const html = buildAlertHtml({
        firstName: sub.firstName,
        eventTitle: event.titleSl ?? event.titleEn,
        eventDate: event.date,
        eventCategory: event.category,
        eventCity,
        eventPrice: event.price,
        eventSlug,
        eventImageUrl: event.imageUrl,
        appUrl,
        email: sub.email,
      });

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: [sub.email], subject, html }),
        });

        if (res.ok) {
          alertsSent++;
          console.log(`  📬 Alert sent to ${sub.email} for "${event.titleSl ?? event.titleEn}"`);
        } else {
          console.warn(`  ⚠️  Alert failed for ${sub.email}: ${res.status}`);
        }

        // Stay well within Resend's rate limit
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.warn(`  ⚠️  Alert error for ${sub.email}:`, err);
      }
    }
  }

  if (alertsSent > 0) {
    console.log(`\n📬 Sent ${alertsSent} instant subscriber alerts`);
  }
}

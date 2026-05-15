/**
 * Newsletter HTML template generator for Zavestni Dogodki.
 * Pure inline-style email HTML — safe for all major email clients.
 */

const BRAND = {
  green: "#2d6a4f",
  greenLight: "#40916c",
  greenPale: "#d8f3dc",
  stone: "#44403c",
  stoneMid: "#78716c",
  stoneLight: "#f5f5f4",
  white: "#ffffff",
  amber: "#d97706",
};

const CATEGORY_COLOR: Record<string, string> = {
  YOGA: "#059669",
  MEDITATION: "#7c3aed",
  BREATHWORK: "#0284c7",
  SOUND_BATH: "#d97706",
  CACAO_CEREMONY: "#ea580c",
  RETREAT: "#0d9488",
  WORKSHOP: "#4f46e5",
  DANCE: "#db2777",
  TANTRA: "#e11d48",
  HEALING: "#65a30d",
  OTHER: "#57534e",
};

const CATEGORY_LABEL: Record<string, string> = {
  YOGA: "Yoga",
  MEDITATION: "Meditacija",
  BREATHWORK: "Dihanje",
  SOUND_BATH: "Zvočna kopel",
  CACAO_CEREMONY: "Kakao ceremonija",
  RETREAT: "Retreat",
  WORKSHOP: "Delavnica",
  DANCE: "Ples",
  TANTRA: "Tantra",
  HEALING: "Zdravljenje",
  OTHER: "Ostalo",
};

const CATEGORY_EMOJI: Record<string, string> = {
  YOGA: "🧘", MEDITATION: "🌀", BREATHWORK: "💨", SOUND_BATH: "🎵",
  CACAO_CEREMONY: "🍫", RETREAT: "🏕️", WORKSHOP: "✨", DANCE: "💃",
  TANTRA: "🌹", HEALING: "🌿", OTHER: "🌸",
};

function formatEventDate(date: Date): string {
  return new Date(date).toLocaleDateString("sl-SI", {
    weekday: "long", day: "numeric", month: "long",
    timeZone: "Europe/Ljubljana",
  });
}

function formatEventTime(date: Date): string {
  const t = new Date(date).toLocaleTimeString("sl-SI", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Ljubljana",
  });
  return t === "00:00" ? "" : t;
}

export interface NewsletterEvent {
  title: string;
  date: Date;
  category: string;
  price: number | null;
  venueName: string | null;
  slug: string;
  imageUrl?: string | null;
}

export interface NewsletterOptions {
  firstName?: string | null;
  events: NewsletterEvent[];
  appUrl?: string;
  unsubscribeUrl?: string;
  edition?: string; // e.g. "Maj 2026 #1"
  intro?: string;
}

function eventCard(event: NewsletterEvent, appUrl: string): string {
  const color = CATEGORY_COLOR[event.category] ?? BRAND.green;
  const label = CATEGORY_LABEL[event.category] ?? "Dogodek";
  const emoji = CATEGORY_EMOJI[event.category] ?? "🌸";
  const time = formatEventTime(event.date);
  const dateStr = formatEventDate(event.date);
  const price = event.price === 0 ? "Brezplačno" : event.price ? `${event.price} €` : "Po dogovoru";
  const href = `${appUrl}/events/${event.slug}`;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4;">
      <tr>
        <td style="background:${color};padding:4px 12px;">
          <span style="color:white;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">${emoji} ${label}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;background:#ffffff;">
          <a href="${href}" style="text-decoration:none;color:${BRAND.stone};font-size:16px;font-weight:700;display:block;margin-bottom:8px;">${event.title}</a>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size:13px;color:${BRAND.stoneMid};padding-right:20px;">📅 ${dateStr}${time ? " · " + time : ""}</td>
            </tr>
            ${event.venueName ? `<tr><td style="font-size:13px;color:${BRAND.stoneMid};padding-top:4px;">📍 ${event.venueName}</td></tr>` : ""}
            <tr>
              <td style="padding-top:10px;">
                <span style="font-size:14px;font-weight:700;color:${color};">${price}</span>
              </td>
            </tr>
          </table>
          <a href="${href}" style="display:inline-block;margin-top:12px;padding:8px 20px;background:${color};color:white;font-size:13px;font-weight:600;border-radius:999px;text-decoration:none;">Oglej si →</a>
        </td>
      </tr>
    </table>`.trim();
}

export function buildNewsletterHtml(opts: NewsletterOptions): string {
  const appUrl = opts.appUrl ?? "https://zavestnidogodki.si";
  const firstName = opts.firstName ? `, ${opts.firstName}` : "";
  const edition = opts.edition ?? new Date().toLocaleDateString("sl-SI", { month: "long", year: "numeric" });
  const unsubscribeUrl = opts.unsubscribeUrl ?? `${appUrl}/unsubscribe`;

  const intro = opts.intro ?? `Ta teden v Sloveniji vás čakajo zavestni dogodki — joga, meditacija, dihanje in še veliko več. Izbrali smo najboljše zate.`;

  const eventsHtml = opts.events.map(e => eventCard(e, appUrl)).join("\n");

  return `<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Zavestni Dogodki — ${edition}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f4;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card wrapper -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.green} 0%,${BRAND.greenLight} 100%);padding:40px 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="color:${BRAND.greenPale};font-size:13px;font-weight:500;letter-spacing:0.05em;">🌿 ZAVESTNI DOGODKI</span>
                    <h1 style="color:${BRAND.white};font-size:26px;font-weight:800;margin:8px 0 0;line-height:1.2;">Prihajajoči dogodki<br>ta teden 🗓️</h1>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;background:rgba(255,255,255,0.15);color:white;font-size:11px;font-weight:600;padding:4px 12px;border-radius:999px;">${edition}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="background:${BRAND.white};padding:32px 40px 8px;">
              <p style="color:${BRAND.stone};font-size:16px;line-height:1.7;margin:0;">
                Zdravo${firstName}! 👋
              </p>
              <p style="color:${BRAND.stone};font-size:15px;line-height:1.7;margin:12px 0 0;">
                ${intro}
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:${BRAND.white};padding:20px 40px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e7e5e4;"></td>
                </tr>
              </table>
              <p style="color:${BRAND.stoneMid};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:16px 0 0;">✨ Izbrani dogodki</p>
            </td>
          </tr>

          <!-- Events -->
          <tr>
            <td style="background:${BRAND.white};padding:16px 40px 24px;">
              ${eventsHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:${BRAND.stoneLight};padding:32px 40px;" align="center">
              <p style="color:${BRAND.stone};font-size:15px;margin:0 0 20px;font-weight:500;">Poglej vse zavestne dogodke v Sloveniji 🇸🇮</p>
              <a href="${appUrl}/events" style="display:inline-block;background:${BRAND.green};color:white;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:15px;font-weight:700;letter-spacing:0.02em;">Vsi dogodki →</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#292524;padding:28px 40px;" align="center">
              <p style="color:#a8a29e;font-size:12px;margin:0 0 8px;">
                🌿 Zavestni Dogodki &middot; Slovenija
              </p>
              <p style="color:#78716c;font-size:11px;margin:0;line-height:1.6;">
                Prejemaš ta email, ker si se prijavil/a na naše novice.<br>
                <a href="${unsubscribeUrl}" style="color:#a8a29e;">Odjavi se</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- End card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildNewsletterText(opts: NewsletterOptions): string {
  const appUrl = opts.appUrl ?? "https://zavestnidogodki.si";
  const firstName = opts.firstName ? `, ${opts.firstName}` : "";
  const lines = [
    `🌿 ZAVESTNI DOGODKI`,
    ``,
    `Zdravo${firstName}!`,
    ``,
    opts.intro ?? `Ta teden v Sloveniji vás čakajo zavestni dogodki.`,
    ``,
    `── PRIHAJAJOČI DOGODKI ──`,
    ``,
    ...opts.events.map(e => {
      const time = formatEventTime(e.date);
      const price = e.price === 0 ? "Brezplačno" : e.price ? `${e.price} €` : "Po dogovoru";
      return [
        `${CATEGORY_EMOJI[e.category] ?? "🌸"} ${e.title}`,
        `📅 ${formatEventDate(e.date)}${time ? " · " + time : ""}`,
        e.venueName ? `📍 ${e.venueName}` : "",
        `💰 ${price}`,
        `🔗 ${appUrl}/events/${e.slug}`,
        ``,
      ].filter(Boolean).join("\n");
    }),
    `── Vsi dogodki: ${appUrl}/events ──`,
    ``,
    `Zavestni Dogodki &middot; zavestnidogodki.si`,
    `Odjava: ${appUrl}/unsubscribe`,
  ];
  return lines.join("\n");
}

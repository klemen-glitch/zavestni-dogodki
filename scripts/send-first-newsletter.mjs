/**
 * One-time script: send the first launch newsletter.
 * Usage: node scripts/send-first-newsletter.mjs [testEmail]
 */

const RESEND_API_KEY = "re_K6NFMgdz_44XP1Hnv4R49DrH4ZTwLYx38";
const APP_URL = "https://zavestnidogodki.si";

// ── Events data (from DB, hardcoded for this first send) ──────────────────────
const events = [
  { title: "Wim Hof Dihalna Delavnica + Ledena Kopel", date: new Date("2026-05-15T08:00:00Z"), category: "BREATHWORK", price: 45, venueName: "Zavestni Prostor Ljubljana", slug: "wim-hof-dihalna-delavnica-ljubljana" },
  { title: "Kakao Ceremonija & Ecstatični Ples", date: new Date("2026-05-16T16:00:00Z"), category: "CACAO_CEREMONY", price: 30, venueName: "Zavestni Prostor Ljubljana", slug: "kakao-ceremonija-in-ecstaticni-ples" },
  { title: "Yin Joga & Zvočna Kopel", date: new Date("2026-05-17T16:00:00Z"), category: "YOGA", price: 25, venueName: "Yoga Studio Bled", slug: "yin-joga-in-zvocna-kopel" },
  { title: "Meditacija s Pojočo Skledo", date: new Date("2026-05-18T17:00:00Z"), category: "MEDITATION", price: 15, venueName: "Center Sonce Maribor", slug: "meditacija-s-pojocom-skledo" },
  { title: "Gong Meditacija ob Polni Luni", date: new Date("2026-05-19T18:00:00Z"), category: "SOUND_BATH", price: 20, venueName: "Zavestni Prostor Ljubljana", slug: "gong-meditacija-polna-luna" },
  { title: "Vikend Retreat: Joga, Meditacija & Narava", date: new Date("2026-05-24T13:00:00Z"), category: "RETREAT", price: 320, venueName: "Hiša Miru Bohinj", slug: "vikend-retreat-joga-meditacija-bohinj" },
];

const BRAND = { green: "#2d6a4f", greenLight: "#40916c", greenPale: "#d8f3dc", stone: "#44403c", stoneMid: "#78716c", stoneLight: "#f5f5f4", white: "#ffffff" };
const CAT_COLOR = { YOGA:"#059669",MEDITATION:"#7c3aed",BREATHWORK:"#0284c7",SOUND_BATH:"#d97706",CACAO_CEREMONY:"#ea580c",RETREAT:"#0d9488",WORKSHOP:"#4f46e5",DANCE:"#db2777",TANTRA:"#e11d48",HEALING:"#65a30d",OTHER:"#57534e" };
const CAT_LABEL = { YOGA:"Yoga",MEDITATION:"Meditacija",BREATHWORK:"Dihanje",SOUND_BATH:"Zvočna kopel",CACAO_CEREMONY:"Kakao ceremonija",RETREAT:"Retreat",WORKSHOP:"Delavnica",DANCE:"Ples",TANTRA:"Tantra",HEALING:"Zdravljenje",OTHER:"Ostalo" };
const CAT_EMOJI = { YOGA:"🧘",MEDITATION:"🌀",BREATHWORK:"💨",SOUND_BATH:"🎵",CACAO_CEREMONY:"🍫",RETREAT:"🏕️",WORKSHOP:"✨",DANCE:"💃",TANTRA:"🌹",HEALING:"🌿",OTHER:"🌸" };

function fmtDate(d) {
  return new Date(d).toLocaleDateString("sl-SI", { weekday:"long",day:"numeric",month:"long",timeZone:"Europe/Ljubljana" });
}
function fmtTime(d) {
  const t = new Date(d).toLocaleTimeString("sl-SI",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Ljubljana"});
  return t === "00:00" ? "" : t;
}

function eventCard(e) {
  const color = CAT_COLOR[e.category] ?? BRAND.green;
  const label = CAT_LABEL[e.category] ?? "Dogodek";
  const emoji = CAT_EMOJI[e.category] ?? "🌸";
  const time = fmtTime(e.date);
  const price = e.price === 0 ? "Brezplačno" : e.price ? `${e.price} €` : "Po dogovoru";
  const href = `${APP_URL}/events/${e.slug}`;
  return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4;">
  <tr><td style="background:${color};padding:6px 16px;">
    <span style="color:white;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${emoji} ${label}</span>
  </td></tr>
  <tr><td style="padding:16px 20px;background:#ffffff;">
    <a href="${href}" style="text-decoration:none;color:${BRAND.stone};font-size:16px;font-weight:700;display:block;margin-bottom:10px;line-height:1.3;">${e.title}</a>
    <p style="margin:0 0 4px;font-size:13px;color:${BRAND.stoneMid};">📅 ${fmtDate(e.date)}${time ? " · "+time : ""}</p>
    ${e.venueName ? `<p style="margin:0 0 12px;font-size:13px;color:${BRAND.stoneMid};">📍 ${e.venueName}</p>` : "<p style='margin:0 0 12px;'></p>"}
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:16px;"><span style="font-size:15px;font-weight:800;color:${color};">${price}</span></td>
      <td><a href="${href}" style="display:inline-block;padding:7px 18px;background:${color};color:white;font-size:12px;font-weight:700;border-radius:999px;text-decoration:none;">Oglej si →</a></td>
    </tr></table>
  </td></tr>
</table>`;
}

function buildHtml(firstName) {
  const greeting = firstName ? `Zdravo, ${firstName}!` : "Zdravo!";
  const edition = new Date().toLocaleDateString("sl-SI",{month:"long",year:"numeric"});
  const eventsHtml = events.map(eventCard).join("\n");
  return `<!DOCTYPE html>
<html lang="sl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Zavestni Dogodki — ${edition}</title></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f4">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

  <!-- HEADER -->
  <tr><td style="background:${BRAND.green};padding:40px 40px 36px;">
    <p style="margin:0 0 6px;color:${BRAND.greenPale};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">🌿 Zavestni Dogodki</p>
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;line-height:1.25;">Prihajajoči zavestni<br>dogodki v Sloveniji 🗓️</h1>
    <p style="margin:12px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">${edition} &middot; Posebna otvoritev</p>
  </td></tr>

  <!-- LAUNCH BANNER -->
  <tr><td style="background:#fef3c7;padding:14px 40px;border-bottom:1px solid #fcd34d;">
    <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">🎉 <strong>Zavestni Dogodki so pravkar odprli svoja vrata!</strong> Vse storitve so za enkrat popolnoma brezplačne — posebna akcija ob otvoritvi.</p>
  </td></tr>

  <!-- GREETING -->
  <tr><td style="background:#ffffff;padding:32px 40px 16px;">
    <p style="margin:0;color:${BRAND.stone};font-size:16px;font-weight:600;">${greeting} 👋</p>
    <p style="margin:12px 0 0;color:${BRAND.stone};font-size:15px;line-height:1.75;">
      Veseli nas, da si del skupnosti Zavestnih Dogodkov — prvega kuricanega imenika zavestnih, duhovnih in wellness dogodkov v <strong>Sloveniji</strong>. 🇸🇮
    </p>
    <p style="margin:12px 0 0;color:${BRAND.stone};font-size:15px;line-height:1.75;">
      Ta teden te čakajo fantastični dogodki: od dihalne delavnice po metodi Wim Hof do zvočnih kopeli, kakao ceremonij in yoga retreatov v naravi. Vse na enem mestu.
    </p>
  </td></tr>

  <!-- EVENTS SECTION HEADER -->
  <tr><td style="background:#ffffff;padding:20px 40px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="border-top:2px solid ${BRAND.green};"></td></tr></table>
    <p style="margin:14px 0 4px;color:${BRAND.stoneMid};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">✨ Izbrani dogodki te dni</p>
  </td></tr>

  <!-- EVENTS -->
  <tr><td style="background:#ffffff;padding:8px 40px 32px;">
    ${eventsHtml}
  </td></tr>

  <!-- CTA BLOCK -->
  <tr><td style="background:#f0fdf4;padding:36px 40px;text-align:center;border-top:1px solid #bbf7d0;">
    <p style="margin:0 0 6px;font-size:18px;font-weight:800;color:${BRAND.green};">Odkrij vse zavestne dogodke 🌿</p>
    <p style="margin:0 0 24px;font-size:14px;color:${BRAND.stoneMid};">Joga · Meditacija · Dihanje · Zvočne kopeli · Retreati · Delavnice</p>
    <a href="${APP_URL}/events" style="display:inline-block;background:${BRAND.green};color:white;text-decoration:none;padding:15px 40px;border-radius:999px;font-size:15px;font-weight:800;letter-spacing:0.02em;">Vsi dogodki v Sloveniji →</a>
    <p style="margin:20px 0 0;font-size:12px;color:${BRAND.stoneMid};">Ali objavi <a href="${APP_URL}/submit" style="color:${BRAND.green};font-weight:600;">svoj dogodek brezplačno</a> →</p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#1c1917;padding:32px 40px;text-align:center;">
    <p style="margin:0 0 6px;color:#a8a29e;font-size:13px;font-weight:600;">🌿 Zavestni Dogodki</p>
    <p style="margin:0 0 12px;color:#78716c;font-size:12px;">Slovenija · zavestnidogodki.si</p>
    <p style="margin:0;color:#57534e;font-size:11px;line-height:1.6;">
      Prejemaš ta email, ker si se prijavil/a na naše novice.<br>
      <a href="${APP_URL}/unsubscribe" style="color:#a8a29e;text-decoration:underline;">Odjavi se</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ── SEND ─────────────────────────────────────────────────────────────────────

const testEmailArg = process.argv[2];

// Recipients: test override OR default to user's email for the first send
const recipients = testEmailArg
  ? [{ email: testEmailArg, firstName: null }]
  : [
      { email: "klemenlor@gmail.com", firstName: "Klemen" },
      // Add real subscribers below:
    ];

const subject = `🌿 Zavestni dogodki ta teden — ${new Date().toLocaleDateString("sl-SI",{day:"numeric",month:"long"})}`;
const from = "Zavestni Dogodki <onboarding@resend.dev>";

console.log(`\n📧 Pošiljam newsletter na ${recipients.length} prejemnik(ov)...\n`);

let sent = 0, failed = 0;
for (const r of recipients) {
  const html = buildHtml(r.firstName);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [r.email], subject, html }),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`  ✅ ${r.email} — ID: ${data.id}`);
    sent++;
  } else {
    console.log(`  ❌ ${r.email} — ${JSON.stringify(data)}`);
    failed++;
  }
}

console.log(`\n📊 Rezultat: ${sent} poslano, ${failed} napak\n`);

/**
 * POST /api/admin/facilitators/[id]/send-welcome
 * Generates a personalised Slovenian welcome email and sends it via Resend.
 * Falls back to logging if RESEND_API_KEY is not set.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { CATEGORY_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

function requireAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookie = req.cookies.get("admin_token")?.value;
  const header = req.headers.get("x-admin-token");
  return cookie === secret || header === secret;
}

function buildWelcomeHtml(name: string, categoryLabel: string, eventTitle: string): string {
  const firstName = name.split(" ")[0];
  return `
<!DOCTYPE html>
<html lang="sl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:sans-serif;background:#f5f5f4;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e7e5e4;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2d6a4f,#1b4332);padding:36px 32px 28px;">
      <p style="color:#74c69d;margin:0 0 8px;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Zavestni Dogodki</p>
      <h1 style="color:#fff;font-size:22px;margin:0;font-weight:700;line-height:1.3;">
        Vaš dogodek je na naši platformi 🌿
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#44403c;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Pozdravljeni, <strong>${firstName}</strong>!
      </p>

      <p style="color:#44403c;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Z veseljem vas obveščamo, da smo vaš dogodek <em>„${eventTitle}"</em>
        dodali na <strong>Zavestni Dogodki</strong> — slovensko platformo za zavestne
        in duhovno-transformativne dogodke.
      </p>

      <p style="color:#44403c;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Naše poslanstvo je združiti vse, ki iščejo pristne izkušnje na področju
        ${categoryLabel.toLowerCase()}, meditacije, ozaveščanja in osebnostne rasti —
        in facilitatorje, ki takšne prostore ustvarjajo.
      </p>

      <!-- Highlight box -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:24px 0;">
        <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 8px;">
          ✅ Kaj to pomeni za vas:
        </p>
        <ul style="color:#15803d;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
          <li>Vaš dogodek je vidno objavljen na zavestnidogodki.si</li>
          <li>Oglaševanje na naši platformi je za vas <strong>brezplačno</strong></li>
          <li>Vaše delavnice vidijo iskalci na Googlu in naši obiskovalci</li>
          <li>Skupaj gradimo skupnost zavestnega življenja v Sloveniji</li>
        </ul>
      </div>

      <p style="color:#44403c;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Upamo, da bo vaš dogodek uspešen in da boste na njem srečali čudovite
        soudeležence! 🙏
      </p>

      <p style="color:#44403c;font-size:15px;line-height:1.7;margin:0 0 8px;">
        Če imate kakršna koli vprašanja ali bi radi posodobili podatke o dogodku,
        nam pišite na:
      </p>
      <a href="mailto:info@zavestnidogodki.si"
        style="color:#2d6a4f;font-weight:600;font-size:15px;">
        info@zavestnidogodki.si
      </a>

      <p style="color:#44403c;font-size:15px;line-height:1.7;margin:32px 0 0;">
        Z ljubeznijo in spoštovanjem,<br>
        <strong>Ekipa Zavestni Dogodki</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#fafaf9;border-top:1px solid #e7e5e4;padding:20px 32px;">
      <p style="color:#a8a29e;font-size:12px;margin:0;line-height:1.6;">
        Zavestni Dogodki · zavestnidogodki.si<br>
        Platforma za zavestne dogodke v Sloveniji
      </p>
    </div>

  </div>
</body>
</html>`.trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizer = await db.organizer.findUnique({
    where: { id: params.id },
    include: { events: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!organizer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recipientEmail = organizer.contactEmail ?? organizer.email;
  if (!recipientEmail) {
    return NextResponse.json({ error: "No email address for this organizer" }, { status: 400 });
  }

  if (organizer.outreachStatus === "SENT" || organizer.outreachStatus === "OPTED_OUT") {
    return NextResponse.json({ error: "Email already sent or organizer opted out" }, { status: 409 });
  }

  const latestEvent = organizer.events[0];
  const eventTitle = latestEvent?.titleSl ?? latestEvent?.titleEn ?? "vaš dogodek";
  const categoryLabel =
    (latestEvent?.category ? CATEGORY_LABEL[latestEvent.category] : null) ?? "zavestnih praks";

  const emailHtml = buildWelcomeHtml(organizer.name, categoryLabel, eventTitle);
  const subject = "Vaš dogodek je na Zavestnih Dogodkih 🌿";

  const hasResend = !!process.env.RESEND_API_KEY;
  let sent = false;

  if (hasResend) {
    sent = await sendEmail({ to: recipientEmail, subject, html: emailHtml });
  } else {
    // Log the email content so the admin can copy-paste it manually
    console.log(`[send-welcome] RESEND_API_KEY not set — would send to ${recipientEmail}:`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML length: ${emailHtml.length} chars`);
    sent = false;
  }

  // Update outreach status regardless (mark attempt)
  await db.organizer.update({
    where: { id: params.id },
    data: {
      outreachSentAt: new Date(),
      outreachStatus: sent || !hasResend ? "SENT" : "PENDING",
      contactEmail: recipientEmail,
    },
  });

  return NextResponse.json({
    ok: true,
    sent,
    hasResend,
    to: recipientEmail,
    subject,
    // Return HTML so admin can preview it in the UI even without Resend
    emailHtml: !hasResend ? emailHtml : undefined,
  });
}

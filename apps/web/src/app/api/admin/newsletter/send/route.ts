import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildNewsletterHtml, buildNewsletterText, type NewsletterEvent } from "@/lib/newsletter-template";

export const dynamic = "force-dynamic";

function requireAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/admin_token=([^;]+)/);
  return m?.[1] === secret ||
    req.headers.get("x-admin-secret") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const testEmail = body.testEmail as string | undefined;
  const edition = body.edition as string | undefined;
  const intro = body.intro as string | undefined;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  // Fetch upcoming events
  const events = await db.event.findMany({
    take: 6,
    include: { venue: true },
    orderBy: [{ featured: "desc" }, { date: "asc" }],
    where: { date: { gte: new Date() }, status: { in: ["APPROVED", "FEATURED"] } },
  });

  const newsletterEvents: NewsletterEvent[] = events.map((e) => ({
    title: e.titleSl ?? e.titleEn,
    date: e.date,
    category: e.category,
    price: e.price,
    venueName: e.venue?.name ?? e.venueName,
    slug: e.slug ?? e.id,
    imageUrl: e.imageUrl,
  }));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const from = process.env.EMAIL_FROM ?? "Zavestni Dogodki <noreply@zavestnidogodki.si>";
  const subject = `🌿 Zavestni dogodki ta teden — ${new Date().toLocaleDateString("sl-SI", { day: "numeric", month: "long" })}`;

  // Send to single test address or all active subscribers
  let recipients: Array<{ email: string; firstName?: string | null }>;
  if (testEmail) {
    recipients = [{ email: testEmail }];
  } else {
    recipients = await db.subscriber.findMany({
      where: { active: true },
      select: { email: true, firstName: true },
    });
  }

  const results: Array<{ email: string; ok: boolean; id?: string }> = [];

  for (const sub of recipients) {
    const html = buildNewsletterHtml({
      firstName: sub.firstName,
      events: newsletterEvents,
      appUrl,
      edition,
      intro,
    });
    const text = buildNewsletterText({
      firstName: sub.firstName,
      events: newsletterEvents,
      appUrl,
      edition,
      intro,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [sub.email], subject, html, text }),
    });

    const data = await res.json().catch(() => ({}));
    results.push({ email: sub.email, ok: res.ok, id: (data as { id?: string }).id });
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return NextResponse.json({ sent, failed, results });
}

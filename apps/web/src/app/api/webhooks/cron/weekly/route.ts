import { NextResponse } from "next/server";

// Called by Vercel Cron: 0 9 * * 0 (every Sunday at 9:00 UTC)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runWeeklyNewsletter, runPersonalisedNewsletter } = await import("@conscious-slovenia/pipeline");

  // 1. Generic Beehiiv newsletter for all subscribers
  await runWeeklyNewsletter({ publish: true, weekOffset: 1 });

  // 2. Personalised email via Resend for subscribers with category/city preferences
  await runPersonalisedNewsletter({ daysAhead: 14 });

  return NextResponse.json({ ok: true });
}

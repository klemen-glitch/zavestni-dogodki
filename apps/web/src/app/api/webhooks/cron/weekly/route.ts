import { NextResponse } from "next/server";

// Called by Vercel Cron: 0 9 * * 0 (every Sunday at 9:00 UTC)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runWeeklyNewsletter } = await import("@conscious-slovenia/pipeline");
  await runWeeklyNewsletter({ publish: true, weekOffset: 1 });

  return NextResponse.json({ ok: true });
}

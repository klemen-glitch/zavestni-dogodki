import { NextResponse } from "next/server";

// Called by Vercel Cron: 0 7 * * * (every morning at 7:00 UTC)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET ?? process.env.WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runPipeline } = await import("@conscious-slovenia/pipeline");
  const result = await runPipeline({ autoApproveAbove: 0.82, trigger: "cron" } as Parameters<typeof runPipeline>[0]);

  return NextResponse.json(result);
}

import { NextResponse } from "next/server";

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookie = req.headers.get("cookie") ?? "";
  const m = cookie.match(/admin_token=([^;]+)/);
  return m?.[1] === secret || req.headers.get("x-admin-secret") === secret;
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dryRun = false } = await req.json().catch(() => ({}));

  // Run pipeline asynchronously (don't await — returns immediately)
  // The actual pipeline runs as a background task
  const { runPipeline } = await import("@conscious-slovenia/pipeline");

  // We run it in the background and return immediately
  runPipeline({ dryRun, autoApproveAbove: 0.82 })
    .then((result) => console.log("Pipeline complete:", result.runId))
    .catch((e) => console.error("Pipeline failed:", e));

  return NextResponse.json({ ok: true, message: "Pipeline started", dryRun });
}

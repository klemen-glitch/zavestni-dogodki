import { NextResponse } from "next/server";
import { createHmac } from "crypto";

function verifyHmac(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return signature === `sha256=${expected}`;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("x-signature") ?? "";
  const secret = process.env.WEBHOOK_SECRET;

  if (secret && !verifyHmac(body, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Fire-and-forget pipeline run
  const { runPipeline } = await import("@conscious-slovenia/pipeline");
  runPipeline({ autoApproveAbove: 0.82, trigger: "webhook" } as Parameters<typeof runPipeline>[0])
    .catch(console.error);

  return NextResponse.json({ ok: true, message: "Scrape pipeline started" });
}

/** Temporary route — adds domain to Resend and returns DNS records. Delete after use. */
import { NextResponse } from "next/server";

export async function GET(_req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

  // List all domains
  const listResp = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const listData = await listResp.json() as { data?: { id: string; name: string; status: string }[] };
  const existing = (listData.data ?? []).find(d => d.name === "zavestnidogodki.si");

  if (existing) {
    // Already exists — fetch full details with DNS records
    const r = await fetch(`https://api.resend.com/domains/${existing.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return NextResponse.json(await r.json());
  }

  // Not found — create it
  const createResp = await fetch("https://api.resend.com/domains", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "zavestnidogodki.si", region: "eu-west-1" }),
  });
  const created = await createResp.json();
  return NextResponse.json({ created: true, status: createResp.status, ...created });
}

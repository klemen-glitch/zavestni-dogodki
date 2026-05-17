/** Temporary route — returns Resend domain DNS records. Delete after use. */
import { NextResponse } from "next/server";

function isAuthorized(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return true;
  const fromHeader = req.headers.get("x-admin-secret");
  const fromAuth = req.headers.get("authorization")?.replace("Bearer ", "");
  return fromHeader === secret || fromAuth === secret;
}

export async function GET(_req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });

  // List all domains on the Resend account
  const resp = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await resp.json() as { data?: { id: string; name: string; status: string; records: unknown[] }[] };

  const domain = (data.data ?? []).find(d => d.name === "zavestnidogodki.si");
  if (!domain) return NextResponse.json({ domains: data.data?.map(d => d.name), error: "zavestnidogodki.si not found" });

  // Fetch full record details
  const r2 = await fetch(`https://api.resend.com/domains/${domain.id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const full = await r2.json();
  return NextResponse.json(full);
}

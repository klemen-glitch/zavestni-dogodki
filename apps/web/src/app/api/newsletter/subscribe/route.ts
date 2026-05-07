import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { email, firstName } = await req.json();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Neveljaven email naslov." }, { status: 400 });
  }

  // Save to local DB
  await db.subscriber.upsert({
    where: { email },
    create: { email, firstName, source: "web_form", active: true },
    update: { active: true, firstName: firstName ?? undefined },
  });

  // Sync to Beehiiv (if configured)
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;

  if (apiKey && pubId) {
    await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, first_name: firstName, reactivate_existing: true, send_welcome_email: true }),
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}

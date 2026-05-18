import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, firstName, preferences = [], cities = [], source = "web_form" } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Neveljaven email naslov." }, { status: 400 });
  }

  // Save/update in local DB
  await db.subscriber.upsert({
    where: { email },
    create: {
      email,
      firstName: firstName?.trim() || undefined,
      source,
      active: true,
      preferences: preferences.length > 0 ? preferences : [],
      cities: cities.length > 0 ? cities : [],
    },
    update: {
      active: true,
      firstName: firstName?.trim() || undefined,
      // Merge preferences (union of old + new, deduplicated)
      ...(preferences.length > 0 && { preferences }),
      ...(cities.length > 0 && { cities }),
    },
  });

  // Sync to Beehiiv (if configured)
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;

  if (apiKey && pubId) {
    await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        first_name: firstName,
        reactivate_existing: true,
        send_welcome_email: true,
        // Pass preferences as custom fields if Beehiiv supports it
        custom_fields: [
          { name: "categories", value: preferences.join(",") },
          { name: "cities", value: cities.join(",") },
        ],
      }),
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}

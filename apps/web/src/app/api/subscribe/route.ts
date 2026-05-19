import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EventCategory } from "@conscious-slovenia/database";

const VALID_CATEGORIES = new Set<string>(Object.values(EventCategory));

function toCategories(raw: unknown): EventCategory[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is EventCategory => typeof v === "string" && VALID_CATEGORIES.has(v));
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    email,
    name,
    categories,
    location,
    source = "web_form",
  } = body as {
    email?: string;
    name?: string;
    categories?: unknown;
    location?: string;
    source?: string;
  };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Neveljaven email naslov." }, { status: 400 });
  }

  const preferences = toCategories(categories);
  const cities = location && location !== "Vse lokacije" ? [location] : [];

  await db.subscriber.upsert({
    where: { email },
    create: {
      email,
      firstName: name?.trim() || undefined,
      source: typeof source === "string" ? source : "web_form",
      active: true,
      preferences,
      cities,
    },
    update: {
      active: true,
      firstName: name?.trim() || undefined,
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
        first_name: name,
        reactivate_existing: true,
        send_welcome_email: true,
        custom_fields: [
          { name: "categories", value: preferences.join(",") },
          { name: "cities", value: cities.join(",") },
        ],
      }),
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}

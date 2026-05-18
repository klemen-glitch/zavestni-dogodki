/**
 * POST /api/admin/facilitators/[id]/research
 * Runs a DeepSeek research session on the organizer and saves contact details.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function requireAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookie = req.cookies.get("admin_token")?.value;
  const header = req.headers.get("x-admin-token");
  return cookie === secret || header === secret;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const organizer = await db.organizer.findUnique({ where: { id } });
  if (!organizer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 503 });
  }

  let researchNotes = "";
  let contactEmail: string | null = null;
  let contactPhone: string | null = null;
  let website: string | null = organizer.website ?? null;
  let instagram: string | null = organizer.instagram ?? null;

  const prompt = `You are a research assistant helping to find contact information for a Slovenian wellness facilitator.

Name: ${organizer.name}
${organizer.bio ? `Bio: ${organizer.bio}` : ""}
${organizer.website ? `Known website: ${organizer.website}` : ""}
${organizer.instagram ? `Known Instagram: ${organizer.instagram}` : ""}
${organizer.facebookUrl ? `Facebook: ${organizer.facebookUrl}` : ""}

Based on the information above, provide a research summary and any contact details you can infer or suggest.
Return ONLY a JSON object with these exact fields:
{
  "email": null,
  "phone": null,
  "website": null,
  "instagram": null,
  "summary": "2-3 sentences about this facilitator, their specialty, and how to best reach them"
}`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`DeepSeek error ${res.status}`);

    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      contactEmail = parsed.email ?? null;
      contactPhone = parsed.phone ?? null;
      website = parsed.website ?? website;
      instagram = parsed.instagram ?? instagram;
      researchNotes = parsed.summary ?? "";
    } else {
      researchNotes = raw.slice(0, 500);
    }
  } catch {
    researchNotes = `AI research ni bilo uspešno za ${organizer.name}. Prosimo preverite ročno.`;
  }

  const updated = await db.organizer.update({
    where: { id },
    data: {
      researchedAt: new Date(),
      researchNotes,
      contactEmail: contactEmail ?? undefined,
      contactPhone: contactPhone ?? undefined,
      website: website ?? undefined,
      instagram: instagram ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, organizer: updated });
}

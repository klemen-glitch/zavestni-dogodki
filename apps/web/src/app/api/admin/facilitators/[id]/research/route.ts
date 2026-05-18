/**
 * POST /api/admin/facilitators/[id]/research
 * Runs an AI web-search research session on the organizer and saves results.
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizer = await db.organizer.findUnique({ where: { id: params.id } });
  if (!organizer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const client = new Anthropic({ apiKey });

  const searchQuery = `${organizer.name} facilitator Slovenia wellness yoga meditation contact email phone website Instagram`;

  let researchNotes = "";
  let contactEmail: string | null = null;
  let contactPhone: string | null = null;
  let website: string | null = organizer.website ?? null;
  let instagram: string | null = organizer.instagram ?? null;

  try {
    // Attempt with web_search tool (beta)
    const response = await (client.beta.messages.create as Function)({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      betas: ["web-search-2025-03-05"],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        {
          role: "user",
          content: `Research this Slovenian wellness facilitator and find their contact details.
Name: ${organizer.name}
${organizer.bio ? `Bio: ${organizer.bio}` : ""}
${organizer.facebookUrl ? `Facebook: ${organizer.facebookUrl}` : ""}

Search for: "${searchQuery}"

Return a JSON object with these fields (null if not found):
{
  "email": "...",
  "phone": "...",
  "website": "...",
  "instagram": "...",
  "summary": "2-3 sentence background about this person and their practice"
}

Return ONLY the JSON, no other text.`,
        },
      ],
    });

    // Extract the text content from the response
    const textBlocks = response.content.filter((b: { type: string }) => b.type === "text");
    const raw = textBlocks.map((b: { text: string }) => b.text).join("");

    // Try to parse JSON from the response
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
    // Fallback: generate research without web search
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `I need to contact a Slovenian wellness facilitator named "${organizer.name}".
${organizer.bio ? `Their bio: ${organizer.bio}` : ""}
${organizer.website ? `Website: ${organizer.website}` : ""}
${organizer.instagram ? `Instagram: ${organizer.instagram}` : ""}

Based on what you know, write 2-3 sentences about this type of facilitator and their practice in Slovenia.
Also suggest what kind of contact info to look for.
Return ONLY JSON: {"summary": "...", "email": null, "phone": null, "website": null, "instagram": null}`,
          },
        ],
      });
      const raw = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        researchNotes = parsed.summary ?? "";
        contactEmail = parsed.email ?? null;
        contactPhone = parsed.phone ?? null;
      } else {
        researchNotes = `Facilitator ${organizer.name} — podatki niso bili najdeni z AI iskanjem. Prosimo poiščite ročno.`;
      }
    } catch {
      researchNotes = `AI iskanje ni bilo uspešno za ${organizer.name}.`;
    }
  }

  // Save results
  const updated = await db.organizer.update({
    where: { id: params.id },
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

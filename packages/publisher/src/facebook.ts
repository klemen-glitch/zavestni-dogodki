/**
 * Facebook Group Publisher
 *
 * Posts approved events to the Zavestni Dogodki Facebook group.
 * Requires FB_ACCESS_TOKEN with `publish_to_groups` permission.
 * The token must be a Page or User token for the group admin.
 *
 * Graph API endpoint: POST /v21.0/{group-id}/feed
 */

import { CATEGORY_EMOJI, CATEGORY_LABEL } from "./utils";

const FB_API_BASE = "https://graph.facebook.com/v21.0";

// Our main group ID
const DEFAULT_GROUP_ID = "529182865647567"; // Zavestni Dogodki Slovenija

export interface FBShareOptions {
  event: {
    id: string;
    slug: string | null;
    titleSl: string | null;
    titleEn: string;
    descriptionSl: string | null;
    descriptionEn: string;
    date: Date;
    price: number | null;
    priceNote: string | null;
    category: string;
    venueName: string | null;
    organizer?: { name: string; instagram?: string | null; website?: string | null } | null;
    venue?: { name: string | null; city: string | null } | null;
  };
  groupId?: string;
  appUrl?: string;
}

export interface FBShareResult {
  ok: boolean;
  postId?: string;
  error?: string;
}

function formatPrice(price: number | null, priceNote?: string | null): string {
  if (price === 0) return "Brezplačno";
  if (price === null) return priceNote ?? "Po dogovoru";
  return `${price} €${priceNote ? ` · ${priceNote}` : ""}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("sl-SI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Ljubljana",
  });
}

function formatTime(date: Date): string {
  const t = date.toLocaleTimeString("sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Ljubljana",
  });
  return t === "00:00" ? "" : t;
}

function buildPostText(options: FBShareOptions): string {
  const { event, appUrl = "https://zavestnidogodki.si" } = options;

  const title = event.titleSl ?? event.titleEn;
  const emoji = CATEGORY_EMOJI[event.category] ?? "🌸";
  const label = CATEGORY_LABEL[event.category] ?? "Dogodek";
  const date = formatDate(event.date);
  const time = formatTime(event.date);
  const location = event.venue?.name ?? event.venueName ?? "";
  const city = event.venue?.city ?? "";
  const price = formatPrice(event.price, event.priceNote);
  const eventUrl = `${appUrl}/events/${event.slug ?? event.id}`;

  // Short description — first 200 chars
  const desc = (event.descriptionSl ?? event.descriptionEn).slice(0, 280).trim();

  // Build organizer mention
  let organizerLine = "";
  if (event.organizer) {
    organizerLine = `👤 ${event.organizer.name}`;
    if (event.organizer.instagram) {
      organizerLine += ` · IG: @${event.organizer.instagram.replace("@", "")}`;
    }
    if (event.organizer.website) {
      organizerLine += `\n🌐 ${event.organizer.website}`;
    }
  }

  const lines = [
    `${emoji} ${title.toUpperCase()}`,
    "",
    desc,
    "",
    `📅 ${date}${time ? ` ob ${time}` : ""}`,
    (location || city) ? `📍 ${[location, city].filter(Boolean).join(", ")}` : "",
    `💶 ${price}`,
    organizerLine ? `\n${organizerLine}` : "",
    "",
    `🔗 Vsi podrobnosti in prijava: ${eventUrl}`,
    "",
    `—`,
    `🌿 Zavestni Dogodki — zavestnidogodki.si`,
    `#${label.replace(/\s+/g, "")} #ZavestniDogodki #Slovenija`,
  ].filter((l) => l !== undefined);

  return lines.join("\n").trim();
}

export async function postEventToFBGroup(options: FBShareOptions): Promise<FBShareResult> {
  const token = process.env.FB_ACCESS_TOKEN;
  const groupId = options.groupId ?? process.env.FB_GROUP_ID ?? DEFAULT_GROUP_ID;
  const appUrl = options.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  if (!token) {
    return { ok: false, error: "FB_ACCESS_TOKEN not set — cannot post to Facebook group" };
  }

  const message = buildPostText({ ...options, appUrl });
  const eventUrl = `${appUrl}/events/${options.event.slug ?? options.event.id}`;

  try {
    const res = await fetch(`${FB_API_BASE}/${groupId}/feed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        link: eventUrl,
      }),
    });

    const data = (await res.json()) as { id?: string; error?: { message: string; code: number } };

    if (!res.ok || data.error) {
      const errMsg = data.error?.message ?? `HTTP ${res.status}`;
      console.error(`❌ FB post failed: ${errMsg}`);
      return { ok: false, error: errMsg };
    }

    console.log(`✅ Posted to FB group ${groupId}: post ID ${data.id}`);
    return { ok: true, postId: data.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ FB post error: ${msg}`);
    return { ok: false, error: msg };
  }
}

/** Build a preview of what the post would look like without actually posting */
export function buildFBPostPreview(options: FBShareOptions): string {
  return buildPostText(options);
}

/**
 * Triggers the generate-blog-content GitHub Actions workflow
 * for a newly approved event. Fire-and-forget — never throws.
 */

const GH_OWNER = "klemen-glitch";
const GH_REPO = "zavestni-dogodki";

export interface ContentTriggerEvent {
  id: string;
  titleSl: string | null;
  titleEn: string;
  category: string;
  location: string | null;
  venueName: string | null;
  organizerName: string | null;
  organizerBio?: string | null;
  organizerWebsite?: string | null;
  descriptionEn?: string | null;
}

export async function triggerBlogContentGeneration(
  events: ContentTriggerEvent[]
): Promise<void> {
  const token = process.env.GH_DISPATCH_TOKEN;
  if (!token) {
    console.warn("[content-trigger] GH_DISPATCH_TOKEN not set — skipping blog generation");
    return;
  }

  // Deduplicate by category+city to avoid redundant articles
  const seen = new Set<string>();
  const unique = events.filter((e) => {
    const city = extractCity(e.location ?? e.venueName ?? "");
    const key = `${e.category}::${city}::${e.organizerName ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const event of unique) {
    const city = extractCity(event.location ?? event.venueName ?? "Ljubljana");

    const payload = {
      event_type: "generate-blog-content",
      client_payload: {
        event_id: event.id,
        title: event.titleSl ?? event.titleEn,
        category: event.category,
        city,
        organizer_name: event.organizerName ?? "",
        organizer_bio: event.organizerBio ?? "",
        organizer_website: event.organizerWebsite ?? "",
        description: event.descriptionEn ?? "",
      },
    };

    try {
      const res = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/dispatches`,
        {
          method: "POST",
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        console.log(`  📝 Blog generation triggered: "${event.titleSl ?? event.titleEn}" (${city})`);
      } else {
        console.warn(`  ⚠️  Blog dispatch failed (${res.status}): ${event.id}`);
      }
    } catch (err) {
      console.warn(`  ⚠️  Blog dispatch error: ${err}`);
    }

    // Small gap between dispatches to avoid GitHub rate limits
    await new Promise((r) => setTimeout(r, 500));
  }
}

/** Extract just the city from a location string like "Trubarjeva 5, Ljubljana" */
function extractCity(location: string): string {
  if (!location) return "Ljubljana";
  // Take the last comma-separated part, or the whole thing if no comma
  const parts = location.split(",").map((p) => p.trim());
  const last = parts[parts.length - 1];
  // If it looks like a zip+city "1000 Ljubljana", strip the zip
  const cityMatch = last.match(/^\d{4}\s+(.+)$/);
  return cityMatch ? cityMatch[1] : last || "Ljubljana";
}

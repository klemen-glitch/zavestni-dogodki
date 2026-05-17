/**
 * Fires a GitHub repository_dispatch event to trigger the generate-blog-content workflow.
 * Requires GH_DISPATCH_TOKEN env var (GitHub PAT with `repo` scope).
 *
 * This function is fire-and-forget — it never throws, so it never blocks
 * the event approval flow.
 */

const GH_OWNER = "klemen-glitch";
const GH_REPO = "zavestni-dogodki";

interface ContentTriggerPayload {
  eventId: string;
  title: string;
  category: string;
  city: string;
  organizerName: string;
  organizerBio?: string;
  organizerWebsite?: string;
  description?: string;
}

export async function triggerContentGeneration(payload: ContentTriggerPayload): Promise<void> {
  const token = process.env.GH_DISPATCH_TOKEN;

  if (!token) {
    console.warn("[content-gen] GH_DISPATCH_TOKEN not set — skipping auto-generation");
    return;
  }

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
        body: JSON.stringify({
          event_type: "generate-blog-content",
          client_payload: {
            event_id: payload.eventId,
            title: payload.title,
            category: payload.category,
            city: payload.city,
            organizer_name: payload.organizerName,
            organizer_bio: payload.organizerBio ?? "",
            organizer_website: payload.organizerWebsite ?? "",
            description: payload.description ?? "",
          },
        }),
      }
    );

    if (res.ok) {
      console.log(`[content-gen] Workflow dispatched for event: ${payload.eventId}`);
    } else {
      const body = await res.text();
      console.error(`[content-gen] Dispatch failed (${res.status}): ${body}`);
    }
  } catch (err) {
    // Never throw — content generation is non-critical
    console.error("[content-gen] Dispatch error:", err);
  }
}

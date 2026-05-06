import type { BeehiivPostPayload, PublishResult } from "./types";

const BEEHIIV_API_BASE = "https://api.beehiiv.com/v2";

export async function publishDraftToBeehiiv(
  markdownContent: string,
  subject: string,
  previewText: string,
  scheduleFor?: Date
): Promise<PublishResult> {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID;

  if (!apiKey || !publicationId) {
    return {
      success: false,
      platform: "beehiiv",
      error: "BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID must be set in .env",
    };
  }

  const payload: BeehiivPostPayload = {
    publication_id: publicationId,
    subject,
    preview_text: previewText,
    body: markdownContent,
    status: scheduleFor ? "confirmed" : "draft",
    ...(scheduleFor && { schedule_for: Math.floor(scheduleFor.getTime() / 1000) }),
  };

  try {
    const response = await fetch(
      `${BEEHIIV_API_BASE}/publications/${publicationId}/posts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        platform: "beehiiv",
        error: `Beehiiv API error ${response.status}: ${errorText}`,
      };
    }

    const data = (await response.json()) as { data: { id: string; url: string } };

    return {
      success: true,
      platform: "beehiiv",
      externalId: data.data.id,
      externalUrl: data.data.url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      platform: "beehiiv",
      error: message,
    };
  }
}

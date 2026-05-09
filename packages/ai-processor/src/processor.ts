import Anthropic from "@anthropic-ai/sdk";
import { EVENT_EXTRACTION_SYSTEM_PROMPT } from "./prompts";
import type { RawFacebookPost, ProcessedEvent, ProcessingResult } from "./types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";

export async function processPost(
  raw: RawFacebookPost
): Promise<ProcessingResult> {
  const userMessage = buildUserMessage(raw);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: "text" as const,
          text: EVENT_EXTRACTION_SYSTEM_PROMPT,
          // Cache the system prompt — it's large and reused for every post
          cache_control: { type: "ephemeral" as const },
        } as Anthropic.TextBlockParam,
      ],
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text block in response");
    }

    const event = JSON.parse(textBlock.text) as ProcessedEvent;

    const usage = response.usage as {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };

    return {
      success: true,
      event,
      rawPost: raw,
      tokensUsed: usage.input_tokens + usage.output_tokens,
      cachedTokens: usage.cache_read_input_tokens ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
      rawPost: raw,
    };
  }
}

export async function processBatch(
  posts: RawFacebookPost[],
  options: { delayMs?: number } = {}
): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  const delay = options.delayMs ?? 500;

  for (const post of posts) {
    const result = await processPost(post);
    results.push(result);

    // Respect rate limits between calls
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return results;
}

function buildUserMessage(raw: RawFacebookPost): string {
  const parts: string[] = [];

  if (raw.authorName) parts.push(`Posted by: ${raw.authorName}`);
  if (raw.postedAt) parts.push(`Posted at: ${raw.postedAt}`);

  parts.push(`\nPost text:\n${raw.text}`);

  if (raw.imageUrls?.length) {
    parts.push(`\nImages attached: ${raw.imageUrls.length} image(s)`);
  }

  return parts.join("\n");
}

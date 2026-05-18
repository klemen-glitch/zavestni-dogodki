import { EVENT_EXTRACTION_SYSTEM_PROMPT } from "./prompts";
import type { RawFacebookPost, ProcessedEvent, ProcessingResult } from "./types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";

// ── DeepSeek response shape ───────────────────────────────────────────────────

interface DeepSeekResponse {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function processPost(
  raw: RawFacebookPost
): Promise<ProcessingResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return { success: false, error: "DEEPSEEK_API_KEY not set", rawPost: raw };
  }

  const userMessage = buildUserMessage(raw);

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          { role: "system", content: EVENT_EXTRACTION_SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DeepSeek API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as DeepSeekResponse;
    const text = data.choices?.[0]?.message?.content ?? "";

    if (!text) throw new Error("Empty response from DeepSeek");

    const event = JSON.parse(text) as ProcessedEvent;

    return {
      success: true,
      event,
      rawPost: raw,
      tokensUsed: data.usage?.total_tokens ?? 0,
      cachedTokens: 0,   // DeepSeek has no prompt caching
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message, rawPost: raw };
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
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return results;
}

function buildUserMessage(raw: RawFacebookPost): string {
  const parts: string[] = [];
  if (raw.authorName) parts.push(`Posted by: ${raw.authorName}`);
  if (raw.postedAt)   parts.push(`Posted at: ${raw.postedAt}`);
  parts.push(`\nPost text:\n${raw.text}`);
  if (raw.imageUrls?.length) {
    parts.push(`\nImages attached: ${raw.imageUrls.length} image(s)`);
  }
  return parts.join("\n");
}

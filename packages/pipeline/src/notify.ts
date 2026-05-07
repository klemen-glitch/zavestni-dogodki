import { prisma } from "@conscious-slovenia/database";

/**
 * Send notifications when new events are saved.
 * Currently supports Slack and Telegram.
 * Silently no-ops if env vars are not set.
 */
export async function notifyNewEvents(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;

  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    select: { titleEn: true, date: true, category: true, status: true, aiConfidence: true },
  });

  const summary = events
    .map((e) => `• ${e.titleEn} [${e.category}] ${(e.aiConfidence ?? 0 * 100).toFixed(0)}% — ${e.status}`)
    .join("\n");

  const message = `🌿 *Zavestni Dogodki — ${events.length} new events scraped*\n\n${summary}\n\nReview: ${process.env.NEXT_PUBLIC_APP_URL}/admin`;

  await Promise.allSettled([
    notifySlack(message),
    notifyTelegram(message),
  ]);
}

async function notifySlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

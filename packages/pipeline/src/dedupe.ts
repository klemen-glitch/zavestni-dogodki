import { prisma } from "@conscious-slovenia/database";
import type { ScrapedPost } from "@conscious-slovenia/scraper";

/**
 * Filter out posts already stored in the DB by sourceUrl.
 * Returns only posts that haven't been processed yet.
 */
export async function deduplicatePosts(
  posts: ScrapedPost[]
): Promise<ScrapedPost[]> {
  if (posts.length === 0) return [];

  const urls = posts.map((p) => p.postUrl).filter(Boolean);

  const existing = await prisma.event.findMany({
    where: { sourceUrl: { in: urls } },
    select: { sourceUrl: true },
  });

  const existingUrls = new Set(existing.map((e) => e.sourceUrl));

  const fresh = posts.filter((p) => !existingUrls.has(p.postUrl));

  console.log(
    `🔍 Dedup: ${posts.length} total → ${fresh.length} new, ${posts.length - fresh.length} already in DB`
  );

  return fresh;
}

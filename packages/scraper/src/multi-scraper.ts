import { chromium, type Browser } from "playwright";
import { getActiveGroups, getOwnedGroups, type GroupConfig } from "./groups";
import { scrapeFacebookGroup } from "./facebook";
import type { ScrapedPost, ScraperResult } from "./types";

export interface MultiScrapeResult {
  totalPosts: number;
  byGroup: Record<string, ScraperResult>;
  allPosts: ScrapedPost[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

// ── Facebook Graph API scraper (for owned groups) ─────────────────────────────
// Requires FB_ACCESS_TOKEN with groups_access_member_info permission.

async function scrapeViaGraphApi(group: GroupConfig): Promise<ScraperResult> {
  const token = process.env.FB_ACCESS_TOKEN;

  if (!token) {
    console.warn(`⚠️  No FB_ACCESS_TOKEN — falling back to Playwright for ${group.name}`);
    return scrapeFacebookGroup({ groupUrl: group.url });
  }

  const startTime = Date.now();
  const posts: ScrapedPost[] = [];
  const errors: string[] = [];

  try {
    // Graph API: get group feed
    const url = `https://graph.facebook.com/v21.0/${group.groupId}/feed?fields=id,message,story,created_time,from,attachments&limit=50&access_token=${token}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as {
      data: Array<{
        id: string;
        message?: string;
        story?: string;
        created_time: string;
        from?: { name: string };
        attachments?: { data: Array<{ media?: { image?: { src: string } } }> };
      }>;
    };

    for (const item of data.data) {
      const text = item.message ?? item.story ?? "";
      if (!text.trim()) continue;

      const imageUrls: string[] = [];
      for (const att of item.attachments?.data ?? []) {
        if (att.media?.image?.src) imageUrls.push(att.media.image.src);
      }

      posts.push({
        postId: item.id,
        text: text.trim(),
        imageUrls,
        postUrl: `https://www.facebook.com/${item.id}`,
        authorName: item.from?.name ?? "Unknown",
        postedAt: item.created_time,
        scrapedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(msg);
    console.error(`❌ Graph API failed for ${group.name}:`, msg);
  }

  return {
    posts,
    scrapedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    errors,
  };
}

// ── Main multi-group runner ───────────────────────────────────────────────────

export async function scrapeAllGroups(options: {
  maxPostsPerGroup?: number;
  headless?: boolean;
  delayBetweenGroupsMs?: number;
} = {}): Promise<MultiScrapeResult> {
  const {
    maxPostsPerGroup = 25,
    headless = true,
    delayBetweenGroupsMs = 3000,
  } = options;

  const groups = getActiveGroups();
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const byGroup: Record<string, ScraperResult> = {};
  const allPosts: ScrapedPost[] = [];

  console.log(`\n🌐 Scraping ${groups.length} active Facebook groups...\n`);

  for (const group of groups) {
    console.log(`📡 [${group.priority}] Scraping: ${group.name}`);

    let result: ScraperResult;

    if (group.owned && process.env.FB_ACCESS_TOKEN) {
      // Use Graph API for own group
      result = await scrapeViaGraphApi(group);
    } else {
      // Use Playwright for external groups
      result = await scrapeFacebookGroup({
        groupUrl: group.url,
        maxPosts: maxPostsPerGroup,
        headless,
      });
    }

    // Tag each post with its source group
    const taggedPosts = result.posts.map((p) => ({
      ...p,
      // Embed group context in a parseable way for the AI processor
      text: `[SOURCE: ${group.name} | LANG: ${group.language}]\n\n${p.text}`,
    }));

    byGroup[group.id] = { ...result, posts: taggedPosts };
    allPosts.push(...taggedPosts);

    console.log(`  ✅ ${result.posts.length} posts, ${result.errors.length} errors`);

    if (delayBetweenGroupsMs > 0 && groups.indexOf(group) < groups.length - 1) {
      await new Promise((r) => setTimeout(r, delayBetweenGroupsMs));
    }
  }

  const totalPosts = allPosts.length;
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startTime;

  console.log(`\n✅ Total: ${totalPosts} posts scraped in ${(durationMs / 1000).toFixed(1)}s\n`);

  return { totalPosts, byGroup, allPosts, startedAt, finishedAt, durationMs };
}

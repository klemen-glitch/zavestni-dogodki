import { chromium, type Browser } from "playwright";
import { resolve } from "path";
import type { ScrapedPost, ScraperConfig, ScraperResult } from "./types";

// Auth state lives next to this file: packages/scraper/auth/facebook-state.json
const DEFAULT_AUTH_PATH = resolve(__dirname, "../auth/facebook-state.json");

const FB_GROUP_URL =
  process.env.FB_OWN_GROUP_URL ||
  "https://www.facebook.com/groups/529182865647567/";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCRAPER — innerText-based, works with Facebook's Comet/React rendering
// ─────────────────────────────────────────────────────────────────────────────

export async function scrapeFacebookGroup(
  config: Partial<ScraperConfig> = {}
): Promise<ScraperResult> {
  const {
    groupUrl = FB_GROUP_URL,
    maxPosts = 25,
    headless = true,
    authStatePath = DEFAULT_AUTH_PATH,
  } = config;

  const startTime = Date.now();
  const posts: ScrapedPost[] = [];
  const errors: string[] = [];

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless });

    // Load session from saved cookies
    let context;
    try {
      context = await browser.newContext({ storageState: authStatePath });
      console.log("♻️  Reusing saved Facebook session");
    } catch {
      // No session file — can't log in automatically (Google OAuth blocks Playwright)
      context = await browser.newContext();
      console.warn("⚠️  No saved session found. Run scripts/fb-login-once.mjs first.");
    }

    const page = await context.newPage();

    // Navigate to the group feed
    await page.goto(groupUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(6000);

    console.log(`📜 Scraping up to ${maxPosts} posts from group...`);

    // Scroll + expand "See more" in multiple passes (max 10 scrolls)
    for (let scroll = 0; scroll < 10; scroll++) {
      // Click all visible "See more" / "Več" collapse buttons
      const seeMoreCount = await expandSeeMores(page);
      if (seeMoreCount > 0) await page.waitForTimeout(1000);

      await page.evaluate(() => window.scrollBy(0, 1200));
      await page.waitForTimeout(2000);
    }

    // Final expand pass after scrolling
    await expandSeeMores(page);
    await page.waitForTimeout(1000);

    // ── Extract post text from rendered innerText ──────────────────────────
    const rawText: string = await page.evaluate(() => document.body.innerText);

    // Find where the discussion feed starts
    const feedMarker = "sort group feed by";
    const feedStart = rawText.toLowerCase().indexOf(feedMarker);
    const feedText = feedStart > -1 ? rawText.slice(feedStart + feedMarker.length) : rawText;

    // Extract post URLs for dedup / sourcing
    const postLinks: string[] = await page.$$eval(
      'a[href*="/posts/"], a[href*="/permalink/"]',
      (els: HTMLAnchorElement[]) => [...new Set(els.map((e) => e.href).filter(Boolean))]
    );

    // ── Extract author profile links from DOM ────────────────────────────────
    // Capture Facebook profile URLs of post authors in feed order.
    // We look for <a href="facebook.com/X"> links that wrap an <image> element
    // (the small circular avatar beside each post). We filter out group/events/
    // hashtag/page links and deduplicate consecutive repeats caused by FB's
    // "who commented" stacking — keeping only the first occurrence per block.
    const authorLinks: { fbUrl: string; avatarUrl: string | null }[] = await page.$$eval(
      'a[href*="facebook.com"]',
      (els: HTMLAnchorElement[]) => {
        const SKIP = ["/groups/", "/events/", "/hashtag/", "/pages/", "/marketplace/", "login", "help"];
        const seen = new Set<string>();
        const results: { fbUrl: string; avatarUrl: string | null }[] = [];
        for (const el of els) {
          const href = el.href;
          if (!href || SKIP.some((s) => href.includes(s))) continue;
          // Only links that have an image child (avatar circles)
          const img = el.querySelector("img");
          if (!img) continue;
          const key = href.split("?")[0]; // ignore query params for dedup
          if (seen.has(key)) continue;
          seen.add(key);
          results.push({ fbUrl: href, avatarUrl: img.src ?? null });
        }
        return results.slice(0, 60);
      }
    );

    // Split feed by "Comment as" which appears after every post (admin view)
    // Also handle non-admin boundary: "Like · Comment · Share"
    const sections = feedText.split(/\bComment as\s+\w[\w\s]*\n|\bLike\s*·\s*Comment\s*·\s*Share\b/);

    let postIndex = 0;

    for (const section of sections) {
      if (posts.length >= maxPosts) break;

      const lines = section
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && l !== "Facebook");

      // Find "View insights" line which marks end of post content in admin view
      const insightsIdx = lines.findIndex((l) => l.toLowerCase().includes("view insights"));
      const contentLines = insightsIdx > 0 ? lines.slice(0, insightsIdx) : lines;

      // Skip navigation noise and very short sections
      const text = contentLines
        .filter((l) => !isNoise(l))
        .join("\n")
        .trim();

      if (text.length < 80) continue;

      // Try to find a matching post URL
      const postUrl = postLinks[postIndex] ?? "";
      const postIdMatch = postUrl.match(/\/posts\/(\d+)|\/permalink\/(\d+)/);
      const postId = postIdMatch?.[1] ?? postIdMatch?.[2] ?? `fb-${Date.now()}-${postIndex}`;

      // Try to match author profile link by index
      const authorLink = authorLinks[postIndex];
      const authorFbUrl = authorLink?.fbUrl;
      // Derive a stable Graph API picture URL from the Facebook profile URL
      const authorAvatarUrl = authorFbUrl
        ? fbProfilePictureUrl(authorFbUrl)
        : undefined;

      posts.push({
        postId,
        text,
        imageUrls: [],
        postUrl,
        authorName: extractAuthorFromSection(lines),
        authorFbUrl,
        authorAvatarUrl,
        postedAt: new Date().toISOString(),
        scrapedAt: new Date().toISOString(),
      });

      postIndex++;
    }

    await browser.close();
    console.log(`✅ Extracted ${posts.length} posts`);

    return {
      posts,
      scrapedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      errors,
    };
  } catch (err) {
    await browser?.close();
    const message = err instanceof Error ? err.message : String(err);
    return {
      posts,
      scrapedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      errors: [...errors, message],
    };
  }
}

// ── Helper: click all "See more" / "Več" expand buttons ───────────────────────
async function expandSeeMores(page: import("playwright").Page): Promise<number> {
  try {
    const buttons = await page.$$(
      'div[role="button"]:has-text("See more"), div[role="button"]:has-text("Več"), ' +
      'span[role="button"]:has-text("See more"), span[role="button"]:has-text("Več")'
    );
    for (const btn of buttons) {
      try { await btn.click({ timeout: 1000 }); } catch {}
    }
    return buttons.length;
  } catch {
    return 0;
  }
}

// ── Helper: filter out Facebook UI noise lines ────────────────────────────────
function isNoise(line: string): boolean {
  const noisePatterns = [
    /^Facebook$/,
    /^Like$/,
    /^Comment$/,
    /^Share$/,
    /^Follow$/,
    /^·$/,
    /^\d+$/,
    /^View insights$/i,
    /^\d+\s+post reach$/i,
    /^Number of unread/i,
    /^Write something/i,
    /^Most relevant$/i,
    /^Manage/,
    /^Community home$/,
    /^Overview$/,
    /^Admin tools$/,
  ];
  return noisePatterns.some((p) => p.test(line.trim()));
}

// ── Helper: extract author name from section lines ────────────────────────────
function extractAuthorFromSection(lines: string[]): string {
  // Author is usually first non-empty, non-noise, non-short line
  for (const line of lines) {
    if (line.length > 2 && line.length < 80 && !isNoise(line) && !line.startsWith("http")) {
      return line;
    }
  }
  return "Unknown";
}

// ── Helper: derive stable Facebook profile picture URL ────────────────────────
// Uses the public Graph API picture endpoint which works for public profiles.
// When a profile is private, Facebook returns a default silhouette — that is
// still correct behaviour (no fake photo).
function fbProfilePictureUrl(fbUrl: string): string | undefined {
  try {
    const url = new URL(fbUrl);
    // facebook.com/profile.php?id=123456
    const idParam = url.searchParams.get("id");
    if (idParam && /^\d+$/.test(idParam)) {
      return `https://graph.facebook.com/${idParam}/picture?type=large`;
    }
    // facebook.com/username  (first path segment, not a reserved word)
    const pathParts = url.pathname.split("/").filter(Boolean);
    const username = pathParts[0];
    const RESERVED = new Set(["groups", "events", "pages", "hashtag", "marketplace", "watch", "login"]);
    if (username && !RESERVED.has(username) && !/^\d+$/.test(username)) {
      return `https://graph.facebook.com/${username}/picture?type=large`;
    }
  } catch {
    // invalid URL
  }
  return undefined;
}

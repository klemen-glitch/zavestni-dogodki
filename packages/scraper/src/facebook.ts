import { chromium, type Browser, type Page } from "playwright";
import type { ScrapedPost, ScraperConfig, ScraperResult } from "./types";

const FB_GROUP_URL =
  process.env.FB_OWN_GROUP_URL ||
  "https://www.facebook.com/groups/529182865647567/";

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTICATION
// Save auth state after first login so subsequent runs don't need credentials.
// Usage: run once with headless: false to log in manually, then auth is saved.
// ─────────────────────────────────────────────────────────────────────────────

async function loginToFacebook(page: Page): Promise<void> {
  const email = process.env.FB_EMAIL;
  const password = process.env.FB_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "FB_EMAIL and FB_PASSWORD must be set in .env for initial login"
    );
  }

  await page.goto("https://www.facebook.com/login");
  await page.waitForLoadState("networkidle");

  await page.fill("#email", email);
  await page.fill("#pass", password);
  await page.click('[name="login"]');

  await page.waitForNavigation({ waitUntil: "networkidle" });

  if (page.url().includes("login")) {
    throw new Error("Facebook login failed — check FB_EMAIL and FB_PASSWORD");
  }

  console.log("✅ Facebook login successful");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCRAPER
// ─────────────────────────────────────────────────────────────────────────────

export async function scrapeFacebookGroup(
  config: Partial<ScraperConfig> = {}
): Promise<ScraperResult> {
  const {
    groupUrl = FB_GROUP_URL,
    maxPosts = 30,
    headless = true,
    authStatePath = "./auth/facebook-state.json",
  } = config;

  const startTime = Date.now();
  const posts: ScrapedPost[] = [];
  const errors: string[] = [];

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless });

    // Try to reuse saved auth state, fall back to fresh login
    let context;
    try {
      context = await browser.newContext({ storageState: authStatePath });
      console.log("♻️  Reusing saved Facebook session");
    } catch {
      context = await browser.newContext();
      const loginPage = await context.newPage();
      await loginToFacebook(loginPage);
      await context.storageState({ path: authStatePath });
      await loginPage.close();
      console.log("💾 Auth state saved to", authStatePath);
    }

    const page = await context.newPage();

    // Navigate to the group feed
    await page.goto(`${groupUrl}?sorting_setting=CHRONOLOGICAL`, {
      waitUntil: "networkidle",
    });

    console.log(`📜 Scraping ${maxPosts} posts from group...`);

    // Scroll and collect posts
    let collected = 0;
    let previousHeight = 0;
    let stuckCount = 0;

    while (collected < maxPosts && stuckCount < 3) {
      // Grab all visible post containers
      const postElements = await page.$$('[data-pagelet^="FeedUnit"]');

      for (const el of postElements) {
        if (collected >= maxPosts) break;

        try {
          const postData = await extractPostData(page, el);
          if (postData && !posts.find((p) => p.postId === postData.postId)) {
            posts.push(postData);
            collected++;
          }
        } catch (e) {
          errors.push(`Post extraction error: ${e}`);
        }
      }

      // Scroll down to load more
      await page.evaluate(() => window.scrollBy(0, 2000));
      await page.waitForTimeout(2000);

      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === previousHeight) {
        stuckCount++;
      } else {
        stuckCount = 0;
        previousHeight = newHeight;
      }
    }

    await browser.close();

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

async function extractPostData(
  page: Page,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any
): Promise<ScrapedPost | null> {
  // Extract text content from post
  const text = await element
    .$eval('[data-ad-preview="message"]', (el: Element) => el.textContent ?? "")
    .catch(() => "");

  if (!text.trim()) return null;

  // Extract post URL / ID
  const postUrl = await element
    .$eval('a[href*="/posts/"]', (el: Element) =>
      (el as HTMLAnchorElement).href
    )
    .catch(() => "");

  const postIdMatch = postUrl.match(/\/posts\/(\d+)/);
  const postId = postIdMatch?.[1] ?? `${Date.now()}-${Math.random()}`;

  // Extract author
  const authorName = await element
    .$eval(
      'a[role="link"] strong, h2 a',
      (el: Element) => el.textContent ?? ""
    )
    .catch(() => "Unknown");

  // Extract images
  const imageUrls = await element
    .$$eval('img[src*="scontent"]', (imgs: HTMLImageElement[]) =>
      imgs.map((img) => img.src)
    )
    .catch(() => [] as string[]);

  // Extract post timestamp
  const postedAt = await element
    .$eval("abbr[data-utime]", (el: Element) => {
      const utime = el.getAttribute("data-utime");
      return utime
        ? new Date(parseInt(utime) * 1000).toISOString()
        : new Date().toISOString();
    })
    .catch(() => new Date().toISOString());

  return {
    postId,
    text: text.trim(),
    imageUrls,
    postUrl,
    authorName,
    postedAt,
    scrapedAt: new Date().toISOString(),
  };
}

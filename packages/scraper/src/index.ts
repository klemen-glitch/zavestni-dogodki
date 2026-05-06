import "dotenv/config";
import { scrapeFacebookGroup } from "./facebook";

async function main() {
  console.log("🕷️  Conscious Slovenia — Facebook Group Scraper\n");

  const result = await scrapeFacebookGroup({
    maxPosts: 20,
    headless: true,
  });

  console.log(`\n✅ Scraped ${result.posts.length} posts in ${result.durationMs}ms`);

  if (result.errors.length > 0) {
    console.warn(`⚠️  ${result.errors.length} errors encountered:`);
    result.errors.forEach((e) => console.warn("  -", e));
  }

  // Output for piping to ai-processor
  console.log("\n📦 Raw posts JSON:");
  console.log(JSON.stringify(result.posts, null, 2));
}

main().catch(console.error);

export { scrapeFacebookGroup } from "./facebook";
export type { ScrapedPost, ScraperConfig, ScraperResult } from "./types";

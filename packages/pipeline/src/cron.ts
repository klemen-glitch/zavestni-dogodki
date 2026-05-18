#!/usr/bin/env ts-node
/**
 * Cron runner — call from crontab or a scheduler:
 *
 *   Daily scrape + process (every morning at 7:00):
 *   0 7 * * * cd /path/to/project && npx ts-node packages/pipeline/src/cron.ts daily
 *
 *   Weekly newsletter (every Sunday at 9:00):
 *   0 9 * * 0 cd /path/to/project && npx ts-node packages/pipeline/src/cron.ts weekly
 *
 *   Or with Vercel Cron (in vercel.json):
 *   { "crons": [{ "path": "/api/webhooks/cron/daily", "schedule": "0 7 * * *" }] }
 */

import "dotenv/config";
import { runPipeline } from "./pipeline";
import { runWeeklyNewsletter } from "./newsletter-cron";

const command = process.argv[2];

async function main() {
  switch (command) {
    case "daily":
      console.log("⏰ Running daily scrape pipeline...");
      const result = await runPipeline({ autoApproveAbove: 0.25 }); // approve everything above minimum confidence
      console.log(JSON.stringify(result, null, 2));
      break;

    case "weekly":
      console.log("⏰ Running weekly newsletter...");
      await runWeeklyNewsletter({ publish: true, weekOffset: 1 });
      break;

    default:
      console.error("Usage: ts-node cron.ts [daily|weekly]");
      process.exit(1);
  }
}

main().catch((e) => {
  console.error("💥 Cron job failed:", e);
  process.exit(1);
});

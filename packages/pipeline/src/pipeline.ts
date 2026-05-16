import "dotenv/config";
import { prisma } from "@conscious-slovenia/database";
import { processPost } from "@conscious-slovenia/ai-processor";
import { scrapeAllGroups } from "@conscious-slovenia/scraper";
import type { ScrapedPost } from "@conscious-slovenia/scraper";
import { deduplicatePosts } from "./dedupe";
import { generateSlug } from "./utils";
import { notifyNewEvents } from "./notify";
import { postEventToFBGroup } from "@conscious-slovenia/publisher";

export interface PipelineRunOptions {
  autoApproveAbove?: number;   // confidence threshold for auto-approval (default 0.82)
  maxPostsPerGroup?: number;
  dryRun?: boolean;            // process but don't save to DB
  headless?: boolean;
  trigger?: "cron" | "manual" | "webhook"; // how the run was triggered
}

export interface PipelineRunResult {
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  scraped: number;
  deduplicated: number;
  processed: number;
  saved: number;
  autoApproved: number;
  errors: string[];
  tokenCost: {
    totalTokens: number;
    cachedTokens: number;
    estimatedCostUsd: number;
  };
}

// ── Main pipeline run ─────────────────────────────────────────────────────────

export async function runPipeline(
  options: PipelineRunOptions = {}
): Promise<PipelineRunResult> {
  const {
    autoApproveAbove = 0.82,
    maxPostsPerGroup = 25,
    dryRun = false,
    headless = true,
    trigger = "manual",
  } = options;

  const runId = `run_${Date.now()}`;
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const errors: string[] = [];
  let totalTokens = 0;
  let cachedTokens = 0;
  let saved = 0;
  let autoApproved = 0;

  console.log(`\n🚀 Pipeline run: ${runId}`);
  console.log(`   dry-run: ${dryRun}, autoApproveAbove: ${autoApproveAbove}\n`);

  // ── Step 1: Scrape ─────────────────────────────────────────────────────────
  const scrapeResult = await scrapeAllGroups({ maxPostsPerGroup, headless });

  // ── Step 2: Deduplicate ────────────────────────────────────────────────────
  const freshPosts = await deduplicatePosts(scrapeResult.allPosts);

  if (freshPosts.length === 0) {
    console.log("✅ No new posts to process.\n");
    return makeResult(runId, startedAt, startTime, 0, 0, 0, 0, 0, [], { totalTokens: 0, cachedTokens: 0, estimatedCostUsd: 0 });
  }

  // ── Step 3: AI Processing ──────────────────────────────────────────────────
  console.log(`\n🧠 Processing ${freshPosts.length} new posts with AI...\n`);

  const newEventIds: string[] = [];

  for (const post of freshPosts) {
    process.stdout.write(`  ⚡ ${post.authorName}: `);

    const result = await processPost({
      text: post.text,
      imageUrls: post.imageUrls,
      postUrl: post.postUrl,
      postedAt: post.postedAt,
      authorName: post.authorName,
    });

    if (!result.success || !result.event) {
      errors.push(`AI failed on ${post.postId}: ${result.error}`);
      console.log("❌ AI error");
      continue;
    }

    totalTokens += result.tokensUsed ?? 0;
    cachedTokens += result.cachedTokens ?? 0;

    const event = result.event;
    const confidence = event.confidence;

    // Skip very low-confidence results (probably not event posts)
    if (confidence < 0.25) {
      console.log(`⏭  skipped (confidence ${(confidence * 100).toFixed(0)}%)`);
      continue;
    }

    console.log(`✅ "${event.titleEn}" [${(confidence * 100).toFixed(0)}%]`);

    if (dryRun) {
      console.log("   (dry-run: not saving)");
      saved++;
      continue;
    }

    // ── Step 4: Save to DB ─────────────────────────────────────────────────
    try {
      const shouldAutoApprove = confidence >= autoApproveAbove;
      const slug = await generateSlug(event.titleEn);

      const created = await prisma.event.create({
        data: {
          slug,
          titleSl: event.titleSl,
          titleEn: event.titleEn,
          descriptionSl: event.descriptionSl,
          descriptionEn: event.descriptionEn,
          shortDescEn: event.shortDescEn,
          date: event.date ? new Date(event.date) : new Date(),
          endDate: event.endDate ? new Date(event.endDate) : null,
          price: event.price,
          priceNote: event.priceNote,
          currency: event.currency ?? "EUR",
          category: event.category as never,
          tags: event.tags,
          imageUrl: post.imageUrls[0] ?? null,
          sourceUrl: post.postUrl || null,
          source: "FACEBOOK_GROUP",
          status: shouldAutoApprove ? "APPROVED" : "PENDING_REVIEW",
          venueName: event.venueName ?? event.location,
          rawText: post.text,
          aiProcessed: true,
          aiConfidence: confidence,
        },
      });

      newEventIds.push(created.id);
      saved++;
      if (shouldAutoApprove) autoApproved++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`DB save failed for "${event.titleEn}": ${msg}`);
    }

    // Respect rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  // ── Step 5: Notify ────────────────────────────────────────────────────────
  if (!dryRun && newEventIds.length > 0) {
    await notifyNewEvents(newEventIds).catch((e) =>
      errors.push(`Notify error: ${e}`)
    );

    // ── Step 6: Auto-share approved events to FB group ────────────────────
    // Only posts events that did NOT originate from that same FB group (to avoid duplicates).
    // Requires FB_ACCESS_TOKEN env var with publish_to_groups permission.
    if (process.env.FB_ACCESS_TOKEN) {
      const approvedEvents = await prisma.event.findMany({
        where: {
          id: { in: newEventIds },
          status: { in: ["APPROVED", "FEATURED"] },
          // Don't re-share events already scraped from our own FB group
          NOT: { sourceUrl: { contains: "529182865647567" } },
        },
        include: { organizer: true, venue: true },
      });

      for (const ev of approvedEvents) {
        const shareResult = await postEventToFBGroup({
          event: {
            ...ev,
            titleSl: ev.titleSl,
            titleEn: ev.titleEn,
            descriptionSl: ev.descriptionSl,
            descriptionEn: ev.descriptionEn,
            organizer: ev.organizer ?? null,
            venue: ev.venue ? { name: ev.venue.name, city: ev.venue.city } : null,
          },
        }).catch((e) => ({ ok: false, error: String(e) }));

        if (!shareResult.ok) {
          errors.push(`FB share failed for "${ev.titleEn}": ${shareResult.error}`);
        } else {
          console.log(`  📘 Shared to FB group: ${ev.titleEn}`);
        }

        // Small delay between posts
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  // Anthropic pricing: ~$3/MTok input, $15/MTok output (claude-sonnet-4-6)
  // Cached input: ~$0.30/MTok — rough estimate
  const nonCachedTokens = totalTokens - cachedTokens;
  const estimatedCostUsd =
    (nonCachedTokens * 0.000003) + (cachedTokens * 0.0000003);

  const finishedAt = new Date().toISOString();
  console.log(`\n📊 Pipeline complete: ${saved} events saved, ${autoApproved} auto-approved`);
  console.log(`   Tokens: ${totalTokens} (${cachedTokens} cached) ≈ $${estimatedCostUsd.toFixed(4)}\n`);

  // ── Save run record to DB ─────────────────────────────────────────────────
  if (!dryRun) {
    await prisma.pipelineRun.create({
      data: {
        runId,
        scraped: scrapeResult.totalPosts,
        deduplicated: freshPosts.length,
        processed: freshPosts.length,
        saved,
        autoApproved,
        errors,
        totalTokens,
        cachedTokens,
        estimatedCostUsd,
        durationMs: Date.now() - startTime,
        trigger,
      },
    }).catch(() => {}); // non-critical
  }

  return makeResult(
    runId, startedAt, startTime,
    scrapeResult.totalPosts, freshPosts.length, freshPosts.length,
    saved, autoApproved, errors,
    { totalTokens, cachedTokens, estimatedCostUsd }
  );
}

function makeResult(
  runId: string,
  startedAt: string,
  startTime: number,
  scraped: number,
  deduplicated: number,
  processed: number,
  saved: number,
  autoApproved: number,
  errors: string[],
  tokenCost: { totalTokens: number; cachedTokens: number; estimatedCostUsd: number }
): PipelineRunResult {
  return {
    runId,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    scraped,
    deduplicated,
    processed,
    saved,
    autoApproved,
    errors,
    tokenCost,
  };
}

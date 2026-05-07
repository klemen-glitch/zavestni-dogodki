/**
 * Make.com webhook endpoint.
 *
 * In Make.com, create a scenario:
 * 1. Watch new Facebook group posts (use Facebook Groups module)
 * 2. HTTP module → POST to: https://zavestnidogodki.si/api/webhooks/make
 *    Headers: { "x-webhook-secret": "{{WEBHOOK_SECRET}}" }
 *    Body (JSON): { "posts": [{ "text": "...", "author": "...", "url": "...", "imageUrls": [] }] }
 *
 * This is far more reliable than Playwright for Facebook scraping.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processPost } from "@conscious-slovenia/ai-processor";
import { generateSlug } from "@conscious-slovenia/pipeline";

interface MakePost {
  text: string;
  author?: string;
  url?: string;
  imageUrls?: string[];
  postedAt?: string;
}

export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { posts } = (await req.json()) as { posts: MakePost[] };

  if (!Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json({ error: "No posts provided" }, { status: 400 });
  }

  let saved = 0;
  const errors: string[] = [];

  for (const post of posts) {
    // Dedup by URL
    if (post.url) {
      const exists = await db.event.findFirst({ where: { sourceUrl: post.url } });
      if (exists) continue;
    }

    const result = await processPost({
      text: post.text,
      imageUrls: post.imageUrls ?? [],
      postUrl: post.url,
      postedAt: post.postedAt,
      authorName: post.author,
    });

    if (!result.success || !result.event || result.event.confidence < 0.25) continue;

    try {
      const e = result.event;
      const slug = await generateSlug(e.titleEn);
      await db.event.create({
        data: {
          slug, titleSl: e.titleSl, titleEn: e.titleEn,
          descriptionSl: e.descriptionSl, descriptionEn: e.descriptionEn,
          shortDescEn: e.shortDescEn,
          date: e.date ? new Date(e.date) : new Date(),
          endDate: e.endDate ? new Date(e.endDate) : null,
          price: e.price, priceNote: e.priceNote, currency: "EUR",
          category: e.category as never, tags: e.tags,
          imageUrl: (post.imageUrls ?? [])[0] ?? null,
          sourceUrl: post.url ?? null, source: "FACEBOOK_GROUP",
          status: result.event.confidence >= 0.82 ? "APPROVED" : "PENDING_REVIEW",
          venueName: e.venueName ?? e.location,
          rawText: post.text, aiProcessed: true, aiConfidence: result.event.confidence,
        },
      });
      saved++;
    } catch (err) {
      errors.push(String(err));
    }
  }

  return NextResponse.json({ ok: true, received: posts.length, saved, errors });
}

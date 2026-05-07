import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { ALL_CATEGORIES } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  const events = await db.event.findMany({
    where: { status: { in: ["APPROVED", "FEATURED"] } },
    select: { slug: true, id: true, updatedAt: true },
  });

  const eventUrls: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${base}/events/${e.slug ?? e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = ALL_CATEGORIES.map((cat) => ({
    url: `${base}/events?category=${cat}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [
    { url: base, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/organizers`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/submit`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pass`, changeFrequency: "monthly", priority: 0.6 },
    ...categoryUrls,
    ...eventUrls,
  ];
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { EventCategory } from "@conscious-slovenia/database";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");
  const featured = url.searchParams.get("featured") === "true";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Number(url.searchParams.get("limit") ?? 12));
  const now = new Date();

  const where = {
    status: { in: ["APPROVED", "FEATURED"] as ("APPROVED" | "FEATURED")[] },
    date: { gte: now },
    ...(category && { category: category as EventCategory }),
    ...(featured && { featured: true }),
    ...(q && {
      OR: [
        { titleEn: { contains: q, mode: "insensitive" as const } },
        { titleSl: { contains: q, mode: "insensitive" as const } },
        { descriptionEn: { contains: q, mode: "insensitive" as const } },
        { venueName: { contains: q, mode: "insensitive" as const } },
      ],
    }),
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: [{ featured: "desc" }, { date: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, slug: true, titleEn: true, titleSl: true, shortDescEn: true,
        date: true, endDate: true, price: true, priceNote: true, category: true,
        imageUrl: true, venueName: true, featured: true, tags: true, viewCount: true,
        organizer: { select: { id: true, name: true, instagram: true } },
        venue: { select: { id: true, name: true, city: true } },
      },
    }),
    db.event.count({ where }),
  ]);

  return NextResponse.json({
    events, total, page, pageSize, pages: Math.ceil(total / pageSize),
  });
}

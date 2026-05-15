import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { EventCategory } from "@conscious-slovenia/database";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");
  const featured = url.searchParams.get("featured") === "true";
  const city = url.searchParams.get("city");
  const region = url.searchParams.get("region");
  const free = url.searchParams.get("free") === "true";
  const priceMax = url.searchParams.get("priceMax");
  const dateRange = url.searchParams.get("dateRange");
  const sort = url.searchParams.get("sort");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Number(url.searchParams.get("limit") ?? 12));
  const now = new Date();

  // Date range filter
  let dateFilter: { gte?: Date; lte?: Date } = { gte: now };
  if (dateRange) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (dateRange === "today") {
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (dateRange === "week") {
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      dateFilter = { gte: start, lte: end };
    } else if (dateRange === "month") {
      const end = new Date(start);
      end.setDate(end.getDate() + 30);
      dateFilter = { gte: start, lte: end };
    } else if (dateRange === "weekend") {
      const day = start.getDay();
      const daysUntilSat = day <= 6 ? 6 - day : 0;
      const sat = new Date(start);
      sat.setDate(sat.getDate() + daysUntilSat);
      const sun = new Date(sat);
      sun.setDate(sun.getDate() + 1);
      sun.setHours(23, 59, 59, 999);
      dateFilter = { gte: sat, lte: sun };
    }
  }

  // Sort order
  let orderBy: object[] = [{ featured: "desc" }, { date: "asc" }];
  if (sort === "price_asc") orderBy = [{ featured: "desc" }, { price: "asc" }];
  else if (sort === "price_desc") orderBy = [{ featured: "desc" }, { price: "desc" }];
  else if (sort === "popular") orderBy = [{ featured: "desc" }, { viewCount: "desc" }];

  const where = {
    status: { in: ["APPROVED", "FEATURED"] as ("APPROVED" | "FEATURED")[] },
    date: dateFilter,
    ...(category && { category: category as EventCategory }),
    ...(featured && { featured: true }),
    ...(free && { price: 0 }),
    ...(priceMax && { price: { lte: Number(priceMax) } }),
    ...(city && { venue: { city } }),
    ...(region && { venue: { region } }),
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
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, slug: true, titleEn: true, titleSl: true, shortDescEn: true,
        date: true, endDate: true, price: true, priceNote: true, category: true,
        imageUrl: true, venueName: true, featured: true, tags: true, viewCount: true,
        organizer: { select: { id: true, name: true, instagram: true } },
        venue: { select: { id: true, name: true, city: true, region: true } },
      },
    }),
    db.event.count({ where }),
  ]);

  return NextResponse.json({
    events, total, page, pageSize, pages: Math.ceil(total / pageSize),
  });
}

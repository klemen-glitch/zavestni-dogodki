import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  const events = await db.event.findMany({
    where: { status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 50,
  });

  const items = events.map((e) => `
  <item>
    <title><![CDATA[${e.titleEn}]]></title>
    <link>${base}/events/${e.slug ?? e.id}</link>
    <guid isPermaLink="true">${base}/events/${e.slug ?? e.id}</guid>
    <pubDate>${e.createdAt.toUTCString()}</pubDate>
    <description><![CDATA[${e.shortDescEn ?? e.descriptionEn.slice(0, 200)}]]></description>
    <category>${e.category}</category>
    ${e.imageUrl ? `<enclosure url="${e.imageUrl}" type="image/jpeg"/>` : ""}
  </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Zavestni Dogodki Slovenija</title>
    <link>${base}</link>
    <description>Kurirani zavestni dogodki v Sloveniji — joga, meditacija, dihanje in več.</description>
    <language>sl</language>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

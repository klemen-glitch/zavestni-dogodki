export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdminNewsletterClient } from "./client";

export const metadata: Metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage() {
  const [drafts, upcoming] = await Promise.all([
    db.newsletterDraft.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { events: true } } },
    }),
    db.event.count({
      where: {
        status: { in: ["APPROVED", "FEATURED"] },
        date: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) },
      },
    }),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Newsletter</h1>
      <p className="text-stone-500 mb-8">{upcoming} dogodkov v naslednjih 7 dneh</p>
      <AdminNewsletterClient drafts={drafts} upcomingCount={upcoming} />
    </div>
  );
}

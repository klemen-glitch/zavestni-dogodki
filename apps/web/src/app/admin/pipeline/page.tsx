export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AdminPipelineClient } from "./client";

export const metadata: Metadata = { title: "Pipeline" };

export default async function AdminPipelinePage() {
  const runs = await db.pipelineRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  }).catch(() => []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-stone-800 mb-2">Pipeline</h1>
      <p className="text-stone-500 mb-8">Scraping + AI procesiranje · Facebook → Baza podatkov</p>
      <AdminPipelineClient runs={runs} />
    </div>
  );
}

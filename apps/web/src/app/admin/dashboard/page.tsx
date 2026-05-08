export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatCurrency, timeAgo, CATEGORY_LABEL, CATEGORY_EMOJI } from "@/lib/utils";
import { DashboardActions } from "./client";

export const metadata: Metadata = { title: "Dashboard" };

// Fetch all dashboard data in a single pass
async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    eventStatusCounts,
    totalSubscribers,
    activeSubscribers,
    recentPipelineRuns,
    monthlyCosts,
    monthlyRevenue,
    lastMonthRevenue,
    topCategories,
    recentEvents,
    newsletterDrafts,
    pendingSubmissions,
    totalViews,
  ] = await Promise.all([
    // Event status breakdown
    db.event.groupBy({ by: ["status"], _count: true }),

    // Subscribers
    db.subscriber.count(),
    db.subscriber.count({ where: { active: true } }),

    // Last 5 pipeline runs
    db.pipelineRun.findMany({ orderBy: { createdAt: "desc" }, take: 5 }).catch(() => []),

    // Monthly AI cost
    db.costLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amountUsd: true },
    }).catch(() => ({ _sum: { amountUsd: 0 } })),

    // Monthly revenue
    db.revenueLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amountEur: true },
    }).catch(() => ({ _sum: { amountEur: 0 } })),

    // Last month revenue (for comparison)
    db.revenueLog.aggregate({
      where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
      _sum: { amountEur: true },
    }).catch(() => ({ _sum: { amountEur: 0 } })),

    // Top event categories
    db.event.groupBy({
      by: ["category"],
      where: { status: { in: ["APPROVED", "FEATURED"] } },
      _count: true,
      orderBy: { _count: { category: "desc" } },
      take: 5,
    }),

    // Recently scraped events (last 10)
    db.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, titleEn: true, category: true, status: true, aiConfidence: true, createdAt: true, source: true },
    }),

    // Newsletter stats
    db.newsletterDraft.groupBy({ by: ["status"], _count: true }).catch(() => []),

    // Pending paid submissions
    db.submission.count({ where: { status: "pending", paid: true } }).catch(() => 0),

    // Total event views this month
    db.event.aggregate({
      where: { updatedAt: { gte: startOfMonth } },
      _sum: { viewCount: true },
    }),
  ]);

  const statusMap = Object.fromEntries(eventStatusCounts.map((e) => [e.status, e._count]));
  const newsletterMap = Object.fromEntries(newsletterDrafts.map((d) => [d.status, d._count]));

  const lastPipelineRun = recentPipelineRuns[0];
  const totalPipelineCost = recentPipelineRuns.reduce((s, r) => s + r.estimatedCostUsd, 0);

  return {
    events: {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      pending: statusMap["PENDING_REVIEW"] ?? 0,
      approved: statusMap["APPROVED"] ?? 0,
      featured: statusMap["FEATURED"] ?? 0,
      rejected: statusMap["REJECTED"] ?? 0,
    },
    subscribers: { total: totalSubscribers, active: activeSubscribers },
    costs: {
      thisMonth: monthlyCosts._sum.amountUsd ?? 0,
      pipelineTotal: totalPipelineCost,
    },
    revenue: {
      thisMonth: monthlyRevenue._sum.amountEur ?? 0,
      lastMonth: lastMonthRevenue._sum.amountEur ?? 0,
    },
    pipeline: {
      runs: recentPipelineRuns,
      lastRun: lastPipelineRun,
    },
    topCategories,
    recentEvents,
    newsletter: newsletterMap,
    pendingSubmissions,
    totalViewsThisMonth: totalViews._sum.viewCount ?? 0,
  };
}

function KpiCard({
  label, value, sub, badge, badgeColor = "emerald", alert = false,
}: {
  label: string; value: string | number; sub?: string;
  badge?: string; badgeColor?: string; alert?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border p-6 ${alert && Number(value) > 0 ? "border-amber-300 bg-amber-50" : "border-stone-100"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-stone-400 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-3xl font-bold ${alert && Number(value) > 0 ? "text-amber-700" : "text-stone-800"}`}>{value}</p>
          {sub && <p className="text-stone-400 text-xs mt-1">{sub}</p>}
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${badgeColor}-100 text-${badgeColor}-700`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "V pregledu", APPROVED: "Odobreni", FEATURED: "Izpostavljeni",
  REJECTED: "Zavrnjeni", ARCHIVED: "Arhivirani",
};

const SOURCE_LABEL: Record<string, string> = {
  FACEBOOK_GROUP: "FB", DIRECT_SUBMISSION: "💳", MANUAL: "✍️",
};

export default async function DashboardPage() {
  const data = await getDashboardData();
  const revenueChange = data.revenue.lastMonth > 0
    ? ((data.revenue.thisMonth - data.revenue.lastMonth) / data.revenue.lastMonth * 100).toFixed(0)
    : null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Dashboard</h1>
          <p className="text-stone-400 text-sm mt-0.5">
            {data.pipeline.lastRun
              ? `Zadnji pipeline: ${timeAgo(data.pipeline.lastRun.createdAt)}`
              : "Pipeline še ni zagnan"}
          </p>
        </div>
        <DashboardActions />
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Skupaj dogodki" value={data.events.total} sub={`${data.events.approved} odobrenih`} />
        <KpiCard
          label="V pregledu" value={data.events.pending}
          sub="čaka odobritev" alert={true}
          badge={data.events.pending > 0 ? "!" : undefined} badgeColor="amber"
        />
        <KpiCard label="Naročniki" value={data.subscribers.active}
          sub={`${data.subscribers.total} skupaj`} badge="email" badgeColor="blue" />
        <KpiCard label="Ogledi (mesec)" value={data.totalViewsThisMonth.toLocaleString()} />
        <KpiCard
          label="Prihodki (mesec)" value={formatCurrency(data.revenue.thisMonth)}
          sub={revenueChange ? `${revenueChange > "0" ? "+" : ""}${revenueChange}% vs. prejšnji` : "prvi mesec"}
          badge={data.pendingSubmissions > 0 ? `${data.pendingSubmissions} čaka` : undefined}
          badgeColor="violet"
        />
        <KpiCard
          label="AI strošek (mesec)" value={`$${data.costs.thisMonth.toFixed(3)}`}
          sub="Anthropic Claude" badgeColor="stone"
        />
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Pipeline runs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-50 flex items-center justify-between">
            <h3 className="font-semibold text-stone-700">⚡ Pipeline · zadnjih 5 zagonov</h3>
            <a href="/admin/pipeline" className="text-xs text-emerald-600 hover:underline">Vsi →</a>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                {["Čas", "Scraped", "Novo", "Shranjeno", "Strošek", "Trajanje"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-stone-400 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.pipeline.runs.map((r) => (
                <tr key={r.id} className="border-t border-stone-50">
                  <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-stone-600">{r.scraped}</td>
                  <td className="px-4 py-3 font-mono text-stone-600">{r.deduplicated}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-600">{r.saved}</td>
                  <td className="px-4 py-3 font-mono text-amber-600 text-xs">${r.estimatedCostUsd.toFixed(4)}</td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{(r.durationMs / 1000).toFixed(1)}s</td>
                </tr>
              ))}
              {data.pipeline.runs.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-stone-300">Pipeline še ni zagnan. Zaženi ga ročno na strani Pipeline.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <h3 className="font-semibold text-stone-700 mb-4">📊 Kategorije (odobreni)</h3>
          <div className="space-y-3">
            {data.topCategories.map((c) => {
              const total = data.events.approved + data.events.featured;
              const pct = total > 0 ? Math.round(c._count / total * 100) : 0;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-stone-600">{CATEGORY_EMOJI[c.category]} {CATEGORY_LABEL[c.category]}</span>
                    <span className="text-stone-400 font-mono text-xs">{c._count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {data.topCategories.length === 0 && (
              <p className="text-stone-300 text-sm text-center py-4">Ni podatkov.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-50 flex items-center justify-between">
            <h3 className="font-semibold text-stone-700">🕐 Zadnje aktivnosti</h3>
            <a href="/admin/events" className="text-xs text-emerald-600 hover:underline">Vsi eventi →</a>
          </div>
          <div className="divide-y divide-stone-50">
            {data.recentEvents.map((e) => (
              <div key={e.id} className="px-6 py-3 flex items-center justify-between hover:bg-stone-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{CATEGORY_EMOJI[e.category]}</span>
                  <div className="min-w-0">
                    <p className="text-stone-700 text-sm font-medium truncate">{e.titleEn}</p>
                    <p className="text-stone-400 text-xs">{timeAgo(e.createdAt)} · {SOURCE_LABEL[e.source] ?? e.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {e.aiConfidence != null && (
                    <span className={`text-xs font-mono ${e.aiConfidence >= 0.8 ? "text-emerald-600" : "text-amber-500"}`}>
                      {(e.aiConfidence * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                    e.status === "FEATURED" ? "bg-amber-100 text-amber-700" :
                    e.status === "PENDING_REVIEW" ? "bg-stone-100 text-stone-600" :
                    "bg-red-100 text-red-600"
                  }`}>{STATUS_LABEL[e.status] ?? e.status}</span>
                </div>
              </div>
            ))}
            {data.recentEvents.length === 0 && (
              <p className="text-center py-8 text-stone-300">Ni aktivnosti.</p>
            )}
          </div>
        </div>

        {/* System status */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-5">
          <h3 className="font-semibold text-stone-700">🔧 Status sistema</h3>

          <StatusRow label="Newsletter (mesec)" value={`${data.newsletter["SENT"] ?? 0} poslanih`} ok={(data.newsletter["SENT"] ?? 0) > 0} />
          <StatusRow label="Čakajoče pošiljke" value={`${data.pendingSubmissions} čaka`} ok={data.pendingSubmissions === 0} />
          <StatusRow label="Zavrnjeni eventi" value={`${data.events.rejected} zavrnjenih`} ok={true} />

          <hr className="border-stone-100" />

          <div>
            <h4 className="text-xs text-stone-400 uppercase tracking-wide mb-3">Storitve</h4>
            <div className="space-y-2">
              {[
                { name: "Anthropic Claude", cost: `$${data.costs.thisMonth.toFixed(3)}/mes`, status: "ok" },
                { name: "Supabase (DB)", cost: "~$0/mes (free tier)", status: "ok" },
                { name: "Beehiiv", cost: "~$0/mes (free tier)", status: "ok" },
                { name: "Vercel (hosting)", cost: "~$0/mes (free tier)", status: "ok" },
                { name: "Stripe", cost: "2.9% + 0.30€ / transakcija", status: "ok" },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-stone-700 text-xs font-medium">{s.name}</p>
                    <p className="text-stone-400 text-xs">{s.cost}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
          </div>

          <hr className="border-stone-100" />

          <div>
            <h4 className="text-xs text-stone-400 uppercase tracking-wide mb-3">Crons (Vercel)</h4>
            <div className="space-y-2 text-xs text-stone-500">
              <p>⚡ Dnevni scrape: <span className="font-mono">0 7 * * *</span></p>
              <p>📧 Tedenski NL: <span className="font-mono">0 9 * * 0</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={`font-medium ${ok ? "text-emerald-600" : "text-amber-600"}`}>{value}</span>
    </div>
  );
}

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BLOG_POSTS } from "@/content/blog-posts";
import { timeAgo, CATEGORY_LABEL, CATEGORY_EMOJI } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

// ── helpers ───────────────────────────────────────────────────────────────────

function buildDayBuckets(records: { createdAt: Date }[], days = 30) {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of records) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

function buildCostBuckets(runs: { createdAt: Date; estimatedCostUsd: number }[], days = 30) {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of runs) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + r.estimatedCostUsd);
  }
  return Array.from(buckets.entries()).map(([date, cost]) => ({ date, cost }));
}

// ── data fetch ────────────────────────────────────────────────────────────────

async function getAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    eventsTrend,
    subscribersTrend,
    totalEvents,
    totalOrganizers,
    totalActiveSubscribers,
    totalSubscribers,
    pipelineRuns,
    pipelineCostAll,
    pipelineCostMonth,
    eventsByCategory,
    submissionCount,
    revenueAll,
    revenueMonth,
  ] = await Promise.all([
    db.event.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.subscriber.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    db.event.count(),
    db.organizer.count(),
    db.subscriber.count({ where: { active: true } }),
    db.subscriber.count(),
    db.pipelineRun.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    db.pipelineRun.aggregate({ _sum: { estimatedCostUsd: true, totalTokens: true, cachedTokens: true } }),
    db.pipelineRun.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { estimatedCostUsd: true, totalTokens: true },
    }),
    db.event.groupBy({
      by: ["category"],
      where: { status: { in: ["APPROVED", "FEATURED"] } },
      _count: true,
      orderBy: { _count: { category: "desc" } },
    }),
    db.submission.count().catch(() => 0),
    db.revenueLog.aggregate({ _sum: { amountEur: true } }).catch(() => ({ _sum: { amountEur: 0 } })),
    db.revenueLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amountEur: true },
    }).catch(() => ({ _sum: { amountEur: 0 } })),
  ]);

  const eventDays = buildDayBuckets(eventsTrend);
  const subscriberDays = buildDayBuckets(subscribersTrend);
  const costDays = buildCostBuckets(
    pipelineRuns.map(r => ({ createdAt: r.createdAt, estimatedCostUsd: r.estimatedCostUsd }))
  );

  const totalPipelineCostUsd = pipelineCostAll._sum.estimatedCostUsd ?? 0;
  const totalTokens = pipelineCostAll._sum.totalTokens ?? 0;
  const cachedTokens = pipelineCostAll._sum.cachedTokens ?? 0;
  const monthPipelineCost = pipelineCostMonth._sum.estimatedCostUsd ?? 0;
  const monthTokens = pipelineCostMonth._sum.totalTokens ?? 0;
  const blogCount = BLOG_POSTS.length;
  const blogCostEst = blogCount * 0.05; // rough estimate per article

  return {
    eventDays,
    subscriberDays,
    costDays,
    totals: { totalEvents, totalOrganizers, totalActiveSubscribers, totalSubscribers, blogCount, submissionCount },
    pipeline: {
      runs: pipelineRuns,
      totalCostUsd: totalPipelineCostUsd,
      totalTokens,
      cachedTokens,
      monthCostUsd: monthPipelineCost,
      monthTokens,
    },
    blog: { count: blogCount, costEst: blogCostEst },
    categories: eventsByCategory,
    revenue: {
      allTime: revenueAll._sum.amountEur ?? 0,
      thisMonth: revenueMonth._sum.amountEur ?? 0,
    },
  };
}

// ── svg bar chart ─────────────────────────────────────────────────────────────

function BarChart({
  data,
  color = "#10b981",
  emptyColor = "#e7e5e4",
  chartHeight = 72,
}: {
  data: { date: string; value: number }[];
  color?: string;
  emptyColor?: string;
  chartHeight?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 6;
  const gap = 2;
  const totalW = data.length * (w + gap) - gap;
  const svgH = chartHeight + 18;

  return (
    <svg viewBox={`0 0 ${totalW} ${svgH}`} className="w-full" style={{ height: svgH }}>
      {data.map((d, i) => {
        const bh = d.value > 0 ? Math.max(Math.round((d.value / max) * chartHeight), 3) : 2;
        const x = i * (w + gap);
        const y = chartHeight - bh;
        return (
          <g key={d.date}>
            <rect
              x={x} y={y} width={w} height={bh}
              fill={d.value > 0 ? color : emptyColor}
              rx={1.5}
            />
          </g>
        );
      })}
      {data.map((d, i) =>
        i % 7 === 0 ? (
          <text key={`l-${i}`} x={i * (w + gap) + w / 2} y={svgH - 2}
            textAnchor="middle" fontSize={6} fill="#a8a29e">
            {d.date.slice(5)}
          </text>
        ) : null
      )}
    </svg>
  );
}

function MiniCostChart({ data }: { data: { date: string; cost: number }[] }) {
  return (
    <BarChart
      data={data.map((d) => ({ date: d.date, value: Math.round(d.cost * 10000) }))}
      color="#f59e0b"
      chartHeight={48}
    />
  );
}

// ── service health ────────────────────────────────────────────────────────────

function serviceStatus() {
  return [
    {
      name: "Supabase / PostgreSQL",
      key: "DATABASE_URL",
      present: !!process.env.DATABASE_URL,
      cost: "~$0/mes (free tier)",
      icon: "🗄️",
    },
    {
      name: "Anthropic Claude",
      key: "ANTHROPIC_API_KEY",
      present: !!process.env.ANTHROPIC_API_KEY,
      cost: "Pay-per-token (Sonnet 4)",
      icon: "🤖",
      hint: process.env.ANTHROPIC_API_KEY
        ? `sk-ant-…${process.env.ANTHROPIC_API_KEY.slice(-4)}`
        : "ni nastavljeno",
    },
    {
      name: "GitHub Actions",
      key: "GH_DISPATCH_TOKEN",
      present: !!process.env.GH_DISPATCH_TOKEN,
      cost: "Brezplačno (2000 min/mes)",
      icon: "⚙️",
    },
    {
      name: "Vercel (hosting)",
      key: "VERCEL_URL",
      present: !!process.env.VERCEL_URL || !!process.env.NEXT_PUBLIC_VERCEL_URL,
      cost: "~$0/mes (Hobby tier)",
      icon: "▲",
      hint: process.env.VERCEL_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? "local/dev",
    },
    {
      name: "Resend (e-pošta)",
      key: "RESEND_API_KEY",
      present: !!process.env.RESEND_API_KEY,
      cost: "~$0/mes (3 000 emailov/mes free)",
      icon: "📧",
    },
    {
      name: "Stripe (plačila)",
      key: "STRIPE_SECRET_KEY",
      present: !!process.env.STRIPE_SECRET_KEY,
      cost: "2.9% + 0.30€ / transakcija",
      icon: "💳",
    },
    {
      name: "Google Search Console",
      key: "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
      present: !!process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      cost: "Brezplačno",
      icon: "🔍",
    },
    {
      name: "Bing Webmaster",
      key: "NEXT_PUBLIC_BING_VERIFICATION",
      present: !!process.env.NEXT_PUBLIC_BING_VERIFICATION,
      cost: "Brezplačno",
      icon: "🅱️",
    },
  ];
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const data = await getAnalytics();
  const services = serviceStatus();
  const connectedCount = services.filter((s) => s.present).length;

  const avgEventsPerRun =
    data.pipeline.runs.length > 0
      ? (data.pipeline.runs.reduce((s, r) => s + r.saved, 0) / data.pipeline.runs.length).toFixed(1)
      : "—";
  const avgCostPerRun =
    data.pipeline.runs.length > 0
      ? (data.pipeline.runs.reduce((s, r) => s + r.estimatedCostUsd, 0) / data.pipeline.runs.length).toFixed(4)
      : "—";
  const totalEstimatedSpend =
    data.pipeline.totalCostUsd + data.blog.costEst;

  return (
    <div className="p-8 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Analytics</h1>
        <p className="text-stone-400 text-sm mt-0.5">
          Zadnjih 30 dni · zavestnidogodki.si
        </p>
      </div>

      {/* ── KPI Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Dogodki skupaj", value: data.totals.totalEvents, sub: "v bazi", icon: "📅" },
          { label: "Blog članki", value: data.totals.blogCount, sub: "objavljenih", icon: "📝" },
          { label: "Aktivni naročniki", value: data.totals.totalActiveSubscribers, sub: `${data.totals.totalSubscribers} skupaj`, icon: "📬" },
          { label: "Facilitatorji", value: data.totals.totalOrganizers, sub: "registriranih", icon: "🧘" },
          { label: "Pipeline zagonov", value: data.pipeline.runs.length, sub: "zadnjih 30", icon: "⚡" },
          { label: "Storitve", value: `${connectedCount}/${services.length}`, sub: "povezanih", icon: "🔗" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border border-stone-100 p-5">
            <p className="text-xl mb-1">{k.icon}</p>
            <p className="text-2xl font-bold text-stone-800">{k.value}</p>
            <p className="text-xs text-stone-400 uppercase tracking-wide mt-1">{k.label}</p>
            <p className="text-xs text-stone-300 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Trend Charts ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Events per day */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-stone-700">📅 Novi dogodki / dan</h3>
            <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +{data.eventDays.reduce((s, d) => s + d.count, 0)} zadnjih 30 dni
            </span>
          </div>
          <p className="text-xs text-stone-400 mb-4">Dogodki shranjeni v bazo po datumu</p>
          <BarChart
            data={data.eventDays.map((d) => ({ date: d.date, value: d.count }))}
            color="#10b981"
            chartHeight={80}
          />
        </div>

        {/* Subscribers per day */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-stone-700">📬 Novi naročniki / dan</h3>
            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              +{data.subscriberDays.reduce((s, d) => s + d.count, 0)} zadnjih 30 dni
            </span>
          </div>
          <p className="text-xs text-stone-400 mb-4">Nova e-mail prijava na newsletter</p>
          <BarChart
            data={data.subscriberDays.map((d) => ({ date: d.date, value: d.count }))}
            color="#3b82f6"
            chartHeight={80}
          />
        </div>
      </div>

      {/* ── Cost Deep Dive ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-semibold text-stone-700 mb-6">💸 Stroški — pregled</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Anthropic all-time */}
          <div className="space-y-1">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Anthropic — skupaj</p>
            <p className="text-3xl font-bold text-stone-800">${data.pipeline.totalCostUsd.toFixed(3)}</p>
            <p className="text-xs text-stone-400">
              {(data.pipeline.totalTokens / 1000).toFixed(1)}k tokenov
              · {((data.pipeline.cachedTokens / Math.max(data.pipeline.totalTokens, 1)) * 100).toFixed(0)}% cached
            </p>
          </div>

          {/* Anthropic this month */}
          <div className="space-y-1">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Anthropic — ta mesec</p>
            <p className="text-3xl font-bold text-amber-600">${data.pipeline.monthCostUsd.toFixed(3)}</p>
            <p className="text-xs text-stone-400">
              {(data.pipeline.monthTokens / 1000).toFixed(1)}k tokenov
            </p>
          </div>

          {/* Blog generation */}
          <div className="space-y-1">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Blog generacija (est.)</p>
            <p className="text-3xl font-bold text-violet-600">${data.blog.costEst.toFixed(2)}</p>
            <p className="text-xs text-stone-400">
              {data.blog.count} člankov × $0.05 / artikel
            </p>
          </div>

          {/* Total estimated */}
          <div className="space-y-1 border-l border-stone-100 pl-6">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Skupni ocenjeni strošek</p>
            <p className="text-3xl font-bold text-stone-800">${totalEstimatedSpend.toFixed(2)}</p>
            <p className="text-xs text-stone-400">Anthropic pipeline + blog AI</p>
          </div>
        </div>

        {/* Cost per pipeline run chart */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <p className="text-xs text-stone-400 uppercase tracking-wide mb-3">Strošek / pipeline zagon — zadnjih 30 dni</p>
          <MiniCostChart data={data.costDays} />
          <div className="flex items-center justify-between mt-1 text-xs text-stone-400">
            <span>Avg. ${avgCostPerRun} / zagon</span>
            <span>Avg. {avgEventsPerRun} eventi / zagon</span>
            <span>Revenue: €{data.revenue.thisMonth.toFixed(2)} ta mesec</span>
          </div>
        </div>
      </div>

      {/* ── Categories + Connected Services ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <h3 className="font-semibold text-stone-700 mb-4">📊 Kategorije (odobreni dogodki)</h3>
          <div className="space-y-2.5">
            {data.categories.length === 0 && (
              <p className="text-stone-300 text-sm">Ni podatkov.</p>
            )}
            {data.categories.map((c) => {
              const total = data.categories.reduce((s, x) => s + x._count, 0);
              const pct = total > 0 ? Math.round((c._count / total) * 100) : 0;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-stone-600">
                      {CATEGORY_EMOJI[c.category]} {CATEGORY_LABEL[c.category] ?? c.category}
                    </span>
                    <span className="text-stone-400 font-mono text-xs">
                      {c._count} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Blog content stats */}
          <div className="mt-6 pt-6 border-t border-stone-100">
            <h4 className="text-xs text-stone-400 uppercase tracking-wide mb-3">Blog vsebina</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-stone-800">{data.blog.count}</p>
                <p className="text-xs text-stone-400 mt-0.5">objavljenih člankov</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-violet-600">≈${data.blog.costEst.toFixed(2)}</p>
                <p className="text-xs text-stone-400 mt-0.5">ocenjeni AI strošek</p>
              </div>
            </div>
            {BLOG_POSTS.slice(0, 3).map((p) => (
              <div key={p.slug} className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                <span className="text-stone-300">•</span>
                <span className="truncate">{p.title}</span>
                <span className="ml-auto text-stone-300 flex-shrink-0">{p.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Connected services */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-700">🔗 Povezane storitve</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              connectedCount === services.length
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {connectedCount}/{services.length} aktivnih
            </span>
          </div>

          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.key}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  s.present
                    ? "border-stone-100 bg-stone-50/50"
                    : "border-amber-100 bg-amber-50/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-700">{s.name}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {s.hint ?? s.cost}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  <div className={`w-2 h-2 rounded-full ${s.present ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span className={`text-xs font-medium ${s.present ? "text-emerald-600" : "text-amber-600"}`}>
                    {s.present ? "OK" : "Manjka"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">SEO & Indeksacija</p>
            <div className="space-y-1.5 text-xs text-stone-500">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>Google Search Console — verificiran (HTML meta tag)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${process.env.NEXT_PUBLIC_BING_VERIFICATION ? "bg-emerald-400" : "bg-stone-300"}`} />
                <span>Bing Webmaster — {process.env.NEXT_PUBLIC_BING_VERIFICATION ? "verificiran" : "ni nastavljeno"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span>Sitemap: /sitemap.xml → Google & Bing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                <span>{data.blog.count} blog člankov z Schema.org + FAQPage markup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pipeline History ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-50 flex items-center justify-between">
          <h3 className="font-semibold text-stone-700">⚡ Pipeline — zadnjih 30 zagonov</h3>
          <a href="/admin/pipeline" className="text-xs text-emerald-600 hover:underline">Upravljaj →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                {["Čas", "Trigger", "Scraped", "Deduplicirani", "Shranjeni", "Auto-apr.", "Tokeni", "Strošek", "Trajanje", "Napake"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-stone-400 font-medium text-xs whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {data.pipeline.runs.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3 text-stone-400 text-xs whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      r.trigger === "cron" ? "bg-blue-50 text-blue-600" :
                      r.trigger === "manual" ? "bg-amber-50 text-amber-600" :
                      "bg-violet-50 text-violet-600"
                    }`}>{r.trigger}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-stone-500 text-sm">{r.scraped}</td>
                  <td className="px-4 py-3 font-mono text-stone-500 text-sm">{r.deduplicated}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-600">{r.saved}</td>
                  <td className="px-4 py-3 font-mono text-emerald-500 text-sm">{r.autoApproved}</td>
                  <td className="px-4 py-3 font-mono text-stone-400 text-xs">
                    {(r.totalTokens / 1000).toFixed(1)}k
                    {r.cachedTokens > 0 && (
                      <span className="text-stone-300"> ({((r.cachedTokens / r.totalTokens) * 100).toFixed(0)}%↩)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-amber-600 text-xs">${r.estimatedCostUsd.toFixed(4)}</td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{(r.durationMs / 1000).toFixed(1)}s</td>
                  <td className="px-4 py-3">
                    {r.errors.length > 0 ? (
                      <span className="text-xs text-red-500 font-medium">{r.errors.length} napak</span>
                    ) : (
                      <span className="text-xs text-emerald-400">✓</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.pipeline.runs.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-stone-300">
                    Pipeline še ni bil zagnan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.pipeline.runs.length > 0 && (
          <div className="px-6 py-3 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
            <span>
              Skupaj: {data.pipeline.runs.reduce((s, r) => s + r.scraped, 0)} scrapeanih,{" "}
              {data.pipeline.runs.reduce((s, r) => s + r.saved, 0)} shranjenih
            </span>
            <span>
              Skupni strošek: ${data.pipeline.runs.reduce((s, r) => s + r.estimatedCostUsd, 0).toFixed(4)}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Stroški & Aplikacije" };

// ── Types ─────────────────────────────────────────────────────────────────────

interface Service {
  name: string;
  category: string;
  plan: string;
  costEur: number | null; // null = variable
  costNote: string;
  url: string;
  status: "ok" | "warn" | "unknown";
}

// ── Static service list ───────────────────────────────────────────────────────

const SERVICES: Service[] = [
  {
    name: "Vercel",
    category: "Hosting",
    plan: "Hobby (free tier)",
    costEur: 0,
    costNote: "€0 / mesec",
    url: "https://vercel.com/dashboard",
    status: "ok",
  },
  {
    name: "Supabase",
    category: "Baza podatkov",
    plan: "Free tier",
    costEur: 0,
    costNote: "€0 / mesec · 500 MB storage",
    url: "https://supabase.com/dashboard",
    status: "ok",
  },
  {
    name: "Beehiiv",
    category: "Newsletter",
    plan: "Launch (free tier)",
    costEur: 0,
    costNote: "€0 / mesec · do 2 500 naročnikov",
    url: "https://app.beehiiv.com",
    status: "ok",
  },
  {
    name: "Resend",
    category: "Transakcijska e-pošta",
    plan: "Free tier",
    costEur: 0,
    costNote: "€0 / mesec · 3 000 email/mes",
    url: "https://resend.com/overview",
    status: "ok",
  },
  {
    name: "DeepSeek API",
    category: "AI (scrape procesiranje)",
    plan: "Pay-as-you-go",
    costEur: null,
    costNote: "variabilno — odvisno od tokenov",
    url: "https://platform.deepseek.com/usage",
    status: "ok",
  },
  {
    name: "Playwright / scraping",
    category: "Scraping",
    plan: "Self-hosted",
    costEur: 0,
    costNote: "€0 — teče na Vercel Functions",
    url: "https://playwright.dev",
    status: "ok",
  },
  {
    name: "Stripe",
    category: "Plačila",
    plan: "Pay-per-transaction",
    costEur: 0,
    costNote: "2.9% + €0.30 / transakcija (samo ob plačilu)",
    url: "https://dashboard.stripe.com",
    status: "ok",
  },
];

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getCostsData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    monthlyCostLogs,
    allTimeCostLogs,
    pipelineRuns,
    monthlyRevenue,
  ] = await Promise.all([
    // AI costs this month from CostLog
    db.costLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amountUsd: true },
      _count: true,
    }).catch(() => ({ _sum: { amountUsd: 0 }, _count: 0 })),

    // All-time AI costs
    db.costLog.aggregate({
      _sum: { amountUsd: true },
      _count: true,
    }).catch(() => ({ _sum: { amountUsd: 0 }, _count: 0 })),

    // Pipeline runs this month for cost estimate
    db.pipelineRun.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { estimatedCostUsd: true, totalTokens: true, cachedTokens: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),

    // Revenue this month
    db.revenueLog.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amountEur: true },
    }).catch(() => ({ _sum: { amountEur: 0 } })),
  ]);

  const pipelineCostThisMonth = pipelineRuns.reduce((s, r) => s + r.estimatedCostUsd, 0);
  const totalTokensThisMonth = pipelineRuns.reduce((s, r) => s + r.totalTokens, 0);
  const cachedTokensThisMonth = pipelineRuns.reduce((s, r) => s + r.cachedTokens, 0);
  const hasAiCosts = (monthlyCostLogs._sum.amountUsd ?? 0) > 0 || pipelineCostThisMonth > 0;

  // Prefer CostLog if populated, otherwise fall back to pipeline run estimates
  const aiCostThisMonthUsd = (monthlyCostLogs._sum.amountUsd ?? 0) > 0
    ? (monthlyCostLogs._sum.amountUsd ?? 0)
    : pipelineCostThisMonth;

  const aiCostAllTimeUsd = (allTimeCostLogs._sum.amountUsd ?? 0) > 0
    ? (allTimeCostLogs._sum.amountUsd ?? 0)
    : pipelineRuns.reduce((s, r) => s + r.estimatedCostUsd, 0);

  return {
    aiCostThisMonthUsd,
    aiCostAllTimeUsd,
    aiOperationsThisMonth: monthlyCostLogs._count,
    totalTokensThisMonth,
    cachedTokensThisMonth,
    hasAiCosts,
    revenueThisMonthEur: monthlyRevenue._sum.amountEur ?? 0,
    pipelineRunsThisMonth: pipelineRuns.length,
  };
}

// ── Components ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: "ok" | "warn" | "unknown" }) {
  const colors = { ok: "bg-emerald-400", warn: "bg-amber-400", unknown: "bg-stone-300" };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status]}`} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CostsPage() {
  const data = await getCostsData();

  // Fixed monthly total = sum of known fixed costs (variable ones excluded)
  const fixedMonthlyTotal = SERVICES.reduce((s, svc) => s + (svc.costEur ?? 0), 0);
  // Convert AI USD cost to EUR (approx 1 USD ≈ 0.92 EUR)
  const aiCostEur = data.aiCostThisMonthUsd * 0.92;
  const estimatedMonthlyTotal = fixedMonthlyTotal + aiCostEur;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Stroški &amp; Aplikacije</h1>
        <p className="text-stone-400 text-sm mt-0.5">
          Pregled mesečnih stroškov, povezanih storitev in AI porabe
        </p>
      </div>

      {/* ── Monthly estimate card ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="sm:col-span-1 bg-emerald-700 text-white rounded-2xl p-6">
          <p className="text-emerald-200 text-xs font-medium uppercase tracking-wide mb-1">
            Mesečni strošek (est.)
          </p>
          <p className="text-4xl font-bold">€{estimatedMonthlyTotal.toFixed(2)}</p>
          <p className="text-emerald-300 text-xs mt-2">
            Fiksno: €{fixedMonthlyTotal.toFixed(2)} + AI: €{aiCostEur.toFixed(3)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <p className="text-stone-400 text-xs font-medium uppercase tracking-wide mb-1">
            AI strošek (mesec)
          </p>
          <p className="text-3xl font-bold text-stone-800">
            ${data.aiCostThisMonthUsd.toFixed(4)}
          </p>
          <p className="text-stone-400 text-xs mt-1">
            {data.pipelineRunsThisMonth} pipeline zagonov ·{" "}
            {data.totalTokensThisMonth.toLocaleString()} tokenov
          </p>
          {data.cachedTokensThisMonth > 0 && (
            <p className="text-emerald-600 text-xs mt-0.5">
              {data.cachedTokensThisMonth.toLocaleString()} tokenov iz cache
            </p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <p className="text-stone-400 text-xs font-medium uppercase tracking-wide mb-1">
            Prihodki (mesec)
          </p>
          <p className="text-3xl font-bold text-stone-800">
            €{data.revenueThisMonthEur.toFixed(2)}
          </p>
          <p className={`text-xs mt-1 font-medium ${data.revenueThisMonthEur > estimatedMonthlyTotal ? "text-emerald-600" : "text-stone-400"}`}>
            {data.revenueThisMonthEur > estimatedMonthlyTotal
              ? `+€${(data.revenueThisMonthEur - estimatedMonthlyTotal).toFixed(2)} nad stroški`
              : "Stroški še nepokrite"}
          </p>
        </div>
      </div>

      {/* ── AI cost detail ────────────────────────────────────────────────── */}
      {!data.hasAiCosts && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          <strong>Opomba:</strong> CostLog tabela je prazna — AI stroški niso beleženi v bazi.
          Preverite porabo neposredno na{" "}
          <a
            href="https://platform.deepseek.com/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
          >
            DeepSeek dashboard
          </a>
          .
        </div>
      )}

      {/* ── Services table ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-stone-50">
          <h2 className="font-semibold text-stone-700">Povezane storitve</h2>
          <p className="text-stone-400 text-xs mt-0.5">Vse zunanje storitve, ki jih aplikacija uporablja</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-stone-50">
            <tr>
              {["Status", "Storitev", "Kategorija", "Plan", "Strošek / mesec", "Dashboard"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-stone-400 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SERVICES.map((svc) => (
              <tr key={svc.name} className="border-t border-stone-50 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <StatusDot status={svc.status} />
                </td>
                <td className="px-4 py-3 font-medium text-stone-700">{svc.name}</td>
                <td className="px-4 py-3 text-stone-500 text-xs">{svc.category}</td>
                <td className="px-4 py-3 text-stone-500 text-xs">{svc.plan}</td>
                <td className="px-4 py-3">
                  {svc.costEur === null ? (
                    <span className="text-amber-600 font-medium text-xs">
                      ${data.aiCostThisMonthUsd.toFixed(4)} USD (mesec)
                    </span>
                  ) : svc.costEur === 0 ? (
                    <span className="text-emerald-600 font-medium text-xs">Brezplačno</span>
                  ) : (
                    <span className="text-stone-700 font-medium text-xs">€{svc.costEur}/mes</span>
                  )}
                  <p className="text-stone-400 text-xs mt-0.5">{svc.costNote}</p>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={svc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Odpri →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Connected apps / repos ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-8">
        <h2 className="font-semibold text-stone-700 mb-4">Povezane aplikacije &amp; repozitoriji</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              name: "GitHub — zavestni-dogodki",
              desc: "Monorepo — Next.js + scraper + pipeline",
              url: "https://github.com",
              icon: "⚙️",
              badge: "Source code",
              badgeColor: "stone",
            },
            {
              name: "Vercel — zavestni-dogodki",
              desc: "Produkcijski deploy, cron jobs, env vars",
              url: "https://vercel.com/dashboard",
              icon: "▲",
              badge: "Hosting",
              badgeColor: "stone",
            },
            {
              name: "Supabase — consciousslvn",
              desc: "PostgreSQL baza, Prisma migrations",
              url: "https://supabase.com/dashboard",
              icon: "🐘",
              badge: "Database",
              badgeColor: "teal",
            },
            {
              name: "Beehiiv — newsletter",
              desc: "Newsletter platforma, subscriber sync",
              url: "https://app.beehiiv.com",
              icon: "📧",
              badge: "Newsletter",
              badgeColor: "blue",
            },
          ].map((app) => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 border border-stone-100 rounded-xl hover:border-emerald-200 hover:bg-emerald-50 transition-colors group"
            >
              <span className="text-2xl mt-0.5">{app.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-700 text-sm group-hover:text-emerald-700 truncate">{app.name}</p>
                <p className="text-stone-400 text-xs mt-0.5">{app.desc}</p>
              </div>
              <span className="text-xs text-stone-400 group-hover:text-emerald-600 mt-0.5">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Cron schedule ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h2 className="font-semibold text-stone-700 mb-4">Cron urnik (Vercel)</h2>
        <div className="space-y-3">
          {[
            { label: "Dnevni scrape", cron: "0 7 * * *", desc: "Scraping FB skupin + AI procesiranje", cost: "~$0.002–0.01 / zagon" },
            { label: "Tedenski newsletter", cron: "0 9 * * 0", desc: "Generiranje in pošiljanje newsletterja (nedelja)", cost: "~$0.01–0.05 / zagon" },
          ].map((job) => (
            <div key={job.label} className="flex items-start justify-between p-3 bg-stone-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-stone-700">{job.label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{job.desc}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-xs font-mono text-stone-600 bg-white px-2 py-1 rounded border border-stone-200">{job.cron}</p>
                <p className="text-xs text-stone-400 mt-1">{job.cost}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

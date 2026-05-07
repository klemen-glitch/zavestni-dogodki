"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils";

type Run = {
  id: string; runId: string; scraped: number; deduplicated: number;
  processed: number; saved: number; autoApproved: number; errors: string[];
  totalTokens: number; cachedTokens: number; estimatedCostUsd: number;
  durationMs: number; trigger: string; createdAt: Date;
};

export function AdminPipelineClient({ runs }: { runs: Run[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function triggerRun(dryRun = false) {
    setRunning(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      setLastResult(JSON.stringify(data, null, 2));
      router.refresh();
    } catch (e) {
      setLastResult("Napaka: " + e);
    } finally {
      setRunning(false);
    }
  }

  const totalSaved = runs.reduce((s, r) => s + r.saved, 0);
  const totalCost = runs.reduce((s, r) => s + r.estimatedCostUsd, 0);

  return (
    <div className="space-y-6">
      {/* Trigger */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-semibold text-stone-700 mb-4">Ročni zagon</h3>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => triggerRun(false)} disabled={running}
            className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-800 disabled:opacity-50">
            {running ? "⏳ V teku..." : "⚡ Zaženi pipeline"}
          </button>
          <button onClick={() => triggerRun(true)} disabled={running}
            className="flex items-center gap-2 bg-stone-100 text-stone-700 px-5 py-2.5 rounded-xl font-medium hover:bg-stone-200 disabled:opacity-50">
            🔍 Dry-run (brez shranjevanja)
          </button>
        </div>
        {lastResult && (
          <pre className="mt-4 text-xs bg-stone-50 rounded-xl p-4 overflow-x-auto font-mono text-stone-600 max-h-48">{lastResult}</pre>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Skupaj zagonov", value: runs.length },
          { label: "Skupaj shranjenih", value: totalSaved },
          { label: "Skupni strošek AI", value: `$${totalCost.toFixed(4)}` },
          { label: "Zadnji zagon", value: runs[0] ? timeAgo(runs[0].createdAt) : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-5">
            <p className="text-stone-400 text-xs mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-stone-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Run history */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-50">
          <h3 className="font-semibold text-stone-700">Zgodovina zagonov</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Čas</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Scraped</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Novo</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Shranjeno</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Auto-ok</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Tokeni</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Strošek</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Čas izvajanja</th>
                <th className="text-left px-4 py-3 text-stone-500 font-medium">Napake</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-stone-50 hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{timeAgo(r.createdAt)}</td>
                  <td className="px-4 py-3 text-stone-700 font-mono">{r.scraped}</td>
                  <td className="px-4 py-3 text-stone-700 font-mono">{r.deduplicated}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-700">{r.saved}</td>
                  <td className="px-4 py-3 font-mono text-blue-600">{r.autoApproved}</td>
                  <td className="px-4 py-3 font-mono text-stone-500 text-xs">{r.totalTokens.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-amber-600 text-xs">${r.estimatedCostUsd.toFixed(4)}</td>
                  <td className="px-4 py-3 text-stone-400 text-xs">{(r.durationMs / 1000).toFixed(1)}s</td>
                  <td className="px-4 py-3">
                    {r.errors.length > 0
                      ? <span className="text-xs text-red-500">{r.errors.length} napak</span>
                      : <span className="text-xs text-emerald-500">OK</span>}
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-stone-400">Ni zagonov še.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

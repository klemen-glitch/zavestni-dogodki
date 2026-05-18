"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  id: string; title: string; status: string; weekNumber: number | null;
  year: number | null; createdAt: Date; _count: { events: number };
  externalId: string | null; platform: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-stone-100 text-stone-600",
  SCHEDULED: "bg-blue-100 text-blue-700",
  SENT: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

export function AdminNewsletterClient({ drafts, upcomingCount }: { drafts: Draft[]; upcomingCount: number }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Personalised newsletter state
  const [personalisedRunning, setPersonalisedRunning] = useState(false);
  const [personalisedDryRun, setPersonalisedDryRun] = useState(true);
  const [personalisedTestEmail, setPersonalisedTestEmail] = useState("");
  const [personalisedResult, setPersonalisedResult] = useState<null | {
    totalSubscribers: number; totalEvents: number;
    sent: number; skipped: number; failed: number;
    dryRun: boolean;
    segments: { key: string; count: number }[];
    details: { email: string; eventCount: number; sent: boolean; error?: string }[];
  }>(null);

  async function runPersonalised() {
    setPersonalisedRunning(true);
    setPersonalisedResult(null);
    try {
      const res = await fetch("/api/admin/newsletter/send-personalised", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: personalisedDryRun,
          testEmail: personalisedTestEmail || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) setPersonalisedResult(data);
      else alert("Napaka: " + (data.error ?? "Unknown error"));
    } finally {
      setPersonalisedRunning(false);
    }
  }

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weekOffset: 1 }) });
      const data = await res.json();
      if (res.ok) { setPreview(data.contentMd); router.refresh(); }
      else alert("Napaka: " + data.error);
    } finally { setGenerating(false); }
  }

  async function publish(id: string) {
    setPublishing(id);
    try {
      const res = await fetch("/api/admin/newsletter", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId: id }) });
      if (res.ok) router.refresh();
      else { const d = await res.json(); alert("Napaka: " + d.error); }
    } finally { setPublishing(null); }
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={generate} disabled={generating || upcomingCount === 0}
          className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50">
          {generating ? "⏳ Generiranje..." : "📝 Generiraj osnutek"}
        </button>
        {upcomingCount === 0 && <p className="text-stone-400 text-sm self-center">Ni dogodkov za naslednji teden</p>}
      </div>

      {/* ── Personalised Newsletter ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-stone-700 mb-0.5">✉️ Personaliziran newsletter</h3>
          <p className="text-stone-400 text-xs">
            Vsak naročnik prejme email z dogodki, ki ustrezajo njegovim kategorijam in mestom.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={personalisedDryRun}
              onChange={(e) => setPersonalisedDryRun(e.target.checked)}
              className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
            />
            Dry run (samo pregled, brez pošiljanja)
          </label>

          <div className="flex items-center gap-2">
            <input
              type="email"
              placeholder="Test email (neobvezno)"
              value={personalisedTestEmail}
              onChange={(e) => setPersonalisedTestEmail(e.target.value)}
              className="text-sm px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 w-52"
            />
            <span className="text-xs text-stone-400">— pošlje samo na ta naslov</span>
          </div>

          <button
            onClick={runPersonalised}
            disabled={personalisedRunning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 ${
              personalisedDryRun
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {personalisedRunning
              ? "⏳ Pošiljam…"
              : personalisedDryRun
              ? "🔍 Preveri segmente"
              : "🚀 Pošlji vsem naročnikom"}
          </button>
        </div>

        {/* Results */}
        {personalisedResult && (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Naročniki skupaj", value: personalisedResult.totalSubscribers },
                { label: "Emaili poslani", value: personalisedResult.sent },
                { label: "Preskočeni", value: personalisedResult.skipped },
                { label: "Napake", value: personalisedResult.failed },
              ].map((s) => (
                <div key={s.label} className="bg-stone-50 rounded-xl p-3">
                  <p className="text-lg font-bold text-stone-800">{s.value}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {personalisedResult.dryRun && (
              <p className="text-xs text-amber-600 font-medium">
                ℹ️ Dry run — emaili niso bili poslani. Odkljukajte &ldquo;Dry run&rdquo; za dejansko pošiljanje.
              </p>
            )}

            {personalisedResult.segments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Segmenti naročnikov
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {personalisedResult.segments.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg">
                      <span className="truncate font-mono max-w-xs">{s.key || "(brez preferenc)"}</span>
                      <span className="ml-2 font-semibold text-stone-700 flex-shrink-0">{s.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {personalisedResult.details.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  Podrobnosti (prvih {personalisedResult.details.length})
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {personalisedResult.details.map((d, i) => (
                    <div key={i} className={`flex items-center gap-3 text-xs px-3 py-1.5 rounded-lg ${d.error ? "bg-red-50" : "bg-stone-50"}`}>
                      <span className={d.sent ? "text-emerald-500" : d.error ? "text-red-400" : "text-stone-300"}>
                        {d.sent ? "✓" : d.error ? "✗" : "○"}
                      </span>
                      <span className="text-stone-500 truncate flex-1">{d.email}</span>
                      <span className="text-stone-400 flex-shrink-0">{d.eventCount} dogodki</span>
                      {d.error && <span className="text-red-400 truncate max-w-xs">{d.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <h3 className="font-semibold text-stone-700 mb-3">Predogled osnutka</h3>
          <pre className="text-xs text-stone-600 whitespace-pre-wrap bg-stone-50 rounded-xl p-4 max-h-96 overflow-y-auto font-mono">{preview}</pre>
        </div>
      )}

      {/* Draft history */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-50">
          <h3 className="font-semibold text-stone-700">Zgodovina osnutkov</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Naslov</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Teden</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Dogodki</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Status</th>
              <th className="text-right px-4 py-3 text-stone-500 font-medium">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((d) => (
              <tr key={d.id} className="border-b border-stone-50 hover:bg-stone-50">
                <td className="px-4 py-3 font-medium text-stone-800 max-w-xs truncate">{d.title}</td>
                <td className="px-4 py-3 text-stone-500">Teden {d.weekNumber ?? "—"}, {d.year}</td>
                <td className="px-4 py-3 text-stone-500">{d._count.events}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[d.status] ?? "bg-stone-100 text-stone-600"}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {d.status === "DRAFT" && (
                    <button onClick={() => publish(d.id)} disabled={publishing === d.id}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {publishing === d.id ? "..." : "📤 Pošlji Beehiiv"}
                    </button>
                  )}
                  {d.externalId && (
                    <span className="text-xs text-emerald-600">✓ {d.platform}</span>
                  )}
                </td>
              </tr>
            ))}
            {drafts.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-stone-400">Ni osnutkov.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

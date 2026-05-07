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
      <div className="flex gap-3">
        <button onClick={generate} disabled={generating || upcomingCount === 0}
          className="flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-800 transition-colors disabled:opacity-50">
          {generating ? "⏳ Generiranje..." : "📝 Generiraj osnutek"}
        </button>
        {upcomingCount === 0 && <p className="text-stone-400 text-sm self-center">Ni dogodkov za naslednji teden</p>}
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

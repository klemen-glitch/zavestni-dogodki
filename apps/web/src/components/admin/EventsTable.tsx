"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORY_EMOJI, CATEGORY_LABEL, formatDate } from "@/lib/utils";

type Event = {
  id: string; titleEn: string; category: string; date: Date; status: string;
  aiConfidence: number | null; venueName: string | null; price: number | null;
  organizer: { name: string } | null; source: string;
};

export function AdminEventsTable({
  events, total, page, pageSize, currentStatus,
}: {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [fbShared, setFbShared] = useState<Set<string>>(new Set());

  async function action(id: string, newStatus: string) {
    setLoading(id);
    await fetch(`/api/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(null);
    router.refresh();
  }

  async function shareToFB(id: string) {
    setLoading(`fb-${id}`);
    const res = await fetch(`/api/admin/events/${id}/share-fb`, { method: "POST" });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      setFbShared((prev) => new Set([...prev, id]));
    } else {
      alert(`FB share failed: ${data.error ?? "unknown error"}`);
    }
    setLoading(null);
  }

  const pages = Math.ceil(total / pageSize);

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Dogodek</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Kategorija</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Datum</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">AI %</th>
              <th className="text-left px-4 py-3 text-stone-500 font-medium">Vir</th>
              <th className="text-right px-4 py-3 text-stone-500 font-medium">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-stone-50 hover:bg-stone-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-800 line-clamp-1 max-w-xs">{e.titleEn}</p>
                  <p className="text-stone-400 text-xs">{e.organizer?.name ?? e.venueName ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {CATEGORY_EMOJI[e.category]} {CATEGORY_LABEL[e.category]}
                </td>
                <td className="px-4 py-3 text-stone-500 whitespace-nowrap">
                  {formatDate(e.date, { day: "numeric", month: "short" })}
                </td>
                <td className="px-4 py-3">
                  {e.aiConfidence != null ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      e.aiConfidence >= 0.8 ? "bg-emerald-100 text-emerald-700" :
                      e.aiConfidence >= 0.5 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {(e.aiConfidence * 100).toFixed(0)}%
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-stone-400">
                  {e.source === "FACEBOOK_GROUP" ? "FB" : e.source === "DIRECT_SUBMISSION" ? "💳 Plačano" : "Ročno"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    {currentStatus !== "APPROVED" && (
                      <button onClick={() => action(e.id, "APPROVED")} disabled={loading === e.id}
                        className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                        ✓ Odobri
                      </button>
                    )}
                    {currentStatus !== "FEATURED" && (
                      <button onClick={() => action(e.id, "FEATURED")} disabled={loading === e.id}
                        className="px-2 py-1 bg-amber-500 text-white text-xs rounded-lg hover:bg-amber-600 disabled:opacity-50">
                        ⭐ Featured
                      </button>
                    )}
                    {/* Share to FB group */}
                    {(currentStatus === "APPROVED" || currentStatus === "FEATURED") && (
                      <button
                        onClick={() => shareToFB(e.id)}
                        disabled={loading === `fb-${e.id}` || fbShared.has(e.id)}
                        title="Deli v FB skupino"
                        className={`px-2 py-1 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                          fbShared.has(e.id)
                            ? "bg-blue-100 text-blue-700 cursor-default"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        {fbShared.has(e.id) ? "📘 Deljeno" : loading === `fb-${e.id}` ? "..." : "📘 FB"}
                      </button>
                    )}
                    {currentStatus !== "REJECTED" && (
                      <button onClick={() => action(e.id, "REJECTED")} disabled={loading === e.id}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 disabled:opacity-50">
                        ✕
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <div className="text-center py-12 text-stone-400">
            <p>Ni dogodkov v tej kategoriji.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <a key={p} href={`/admin/events?status=${currentStatus}&page=${p}`}
              className={`px-3 py-1.5 rounded-lg text-sm ${p === page ? "bg-stone-800 text-white" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"}`}>
              {p}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

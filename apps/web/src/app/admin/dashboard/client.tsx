"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DashboardActions() {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function quickRun() {
    setRunning(true);
    await fetch("/api/admin/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: false }),
    });
    setRunning(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => router.refresh()}
        className="px-3 py-2 text-sm bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-colors">
        ↻ Osveži
      </button>
      <button onClick={quickRun} disabled={running}
        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50">
        {running ? "⏳" : "⚡"} {running ? "V teku..." : "Zaženi pipeline"}
      </button>
    </div>
  );
}

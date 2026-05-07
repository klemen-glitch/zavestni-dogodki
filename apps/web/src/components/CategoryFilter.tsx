"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORY_EMOJI, CATEGORY_LABEL, ALL_CATEGORIES } from "@/lib/utils";

export function CategoryFilter({ current }: { current?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function select(cat: string | null) {
    const p = new URLSearchParams(params.toString());
    if (cat) p.set("category", cat);
    else p.delete("category");
    p.delete("page");
    router.push(`/events?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => select(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !current ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
        }`}
      >
        🌍 Vse
      </button>
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => select(cat)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            current === cat ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          {CATEGORY_EMOJI[cat]} {CATEGORY_LABEL[cat]}
        </button>
      ))}
    </div>
  );
}

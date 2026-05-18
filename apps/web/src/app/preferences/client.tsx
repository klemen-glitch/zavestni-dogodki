"use client";

import { useState } from "react";
import { CATEGORY_OPTIONS, CITY_OPTIONS } from "@/components/subscribe/constants";

export function PreferencesForm({ email: initialEmail }: { email: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<"email" | "prefs" | "done">(initialEmail ? "prefs" : "email");
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleCat(v: string) {
    setCategories((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  }
  function toggleCity(v: string) {
    setCities((p) => p.includes(v) ? p.filter((x) => x !== v) : [...p, v]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preferences: categories, cities, source: "preferences_page" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Napaka");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Napaka pri shranjevanju");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="text-center py-4 space-y-3">
        <div className="text-3xl">🎉</div>
        <p className="text-stone-700 font-semibold">Preference posodobljene!</p>
        <p className="text-stone-400 text-sm">
          Od zdaj naprej boste prejemali samo tisto, kar vas zanima.
        </p>
        <a href="/" className="inline-block mt-2 text-sm text-emerald-600 hover:underline">
          ← Nazaj na domačo stran
        </a>
      </div>
    );
  }

  if (step === "email") {
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setStep("prefs"); }}
        className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Vaš e-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="vas@email.si" />
        </div>
        <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm">
          Nadaljuj →
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-stone-700 mb-2.5">
          Katere prakse vas zanimajo?
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((c) => (
            <button key={c.value} type="button" onClick={() => toggleCat(c.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                categories.includes(c.value)
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-stone-50 text-stone-500 border-stone-200 hover:border-emerald-300"
              }`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        {categories.length === 0 && (
          <p className="text-xs text-stone-400 mt-1">Izberite vsaj eno kategorijo ali pustite prazno za vse.</p>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-stone-700 mb-2.5">
          V katerih mestih iščete?
        </p>
        <div className="flex flex-wrap gap-2">
          {CITY_OPTIONS.map((city) => (
            <button key={city} type="button" onClick={() => toggleCity(city)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                cities.includes(city)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-stone-50 text-stone-500 border-stone-200 hover:border-teal-300"
              }`}>
              📍 {city}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-semibold text-sm transition-colors">
          {loading ? "Shranjujem…" : "Shrani preference ✓"}
        </button>
        <a href={`/unsubscribe?email=${encodeURIComponent(email)}`}
          className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-xl text-sm text-center transition-colors">
          Odjava
        </a>
      </div>
    </form>
  );
}

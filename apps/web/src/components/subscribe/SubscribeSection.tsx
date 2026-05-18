"use client";

import { useState } from "react";
import { CATEGORY_OPTIONS, CITY_OPTIONS } from "./constants";

interface SubscribeSectionProps {
  /** "full" shows category + city pickers inline; "compact" shows just email+name */
  variant?: "full" | "compact";
  source?: string;
  className?: string;
}

export function SubscribeSection({
  variant = "full",
  source = "section",
  className = "",
}: SubscribeSectionProps) {
  const [step, setStep] = useState<"form" | "prefs" | "done">(
    variant === "compact" ? "form" : "form"
  );
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(v: string) {
    setCategories((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }
  function toggleCity(v: string) {
    setCities((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  async function submit(extraPrefs?: { preferences: string[]; cities: string[] }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          preferences: extraPrefs?.preferences ?? categories,
          cities: extraPrefs?.cities ?? cities,
          source,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Napaka");
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Napaka pri prijavi");
    } finally {
      setLoading(false);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Vnesite veljaven e-mail."); return; }
    if (variant === "compact") {
      await submit();
    } else {
      setStep("prefs");
      setError("");
    }
  }

  async function handlePrefsSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submit();
  }

  if (step === "done") {
    return (
      <div className={`rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-center text-white ${className}`}>
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-bold mb-2">Prijavljeni ste!</h3>
        <p className="text-emerald-100 text-sm leading-relaxed max-w-sm mx-auto">
          Poslali vam bomo samo tiste zavestne dogodke, ki vas resnično zanimajo.
          Odjava je kadarkoli možna.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 overflow-hidden relative ${className}`}>
      {/* Botanical decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg viewBox="0 0 400 300" className="absolute right-0 bottom-0 w-64 h-48" fill="none">
          <circle cx="350" cy="250" r="120" stroke="white" strokeWidth="1"/>
          <circle cx="350" cy="250" r="80" stroke="white" strokeWidth="0.8"/>
          <path d="M280 260 Q320 220 360 260 Q320 240 280 260Z" fill="white" opacity="0.5"/>
        </svg>
      </div>

      <div className="relative px-8 py-10">
        {/* Header */}
        <div className="mb-6 max-w-lg">
          <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-2">
            Brezplačen newsletter
          </p>
          <h2 className="text-2xl font-bold text-white leading-snug mb-2">
            Prejmite personalizirane zavestne dogodke 🌿
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Pišemo vam samo o tistem, kar vas resnično zanima —
            pravo področje, pravo mesto, pravi čas.
          </p>
        </div>

        {/* Step 1: email + name */}
        {step === "form" && (
          <form onSubmit={handleFormSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ime (neobvezno)"
                className="flex-1 px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Vaš e-mail naslov"
                required
                className="flex-[2] px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap shadow-sm"
              >
                {variant === "compact" ? "Prijavi se →" : "Naprej →"}
              </button>
            </div>
            {error && <p className="text-red-300 text-xs mt-2">{error}</p>}
            <p className="text-emerald-300 text-xs mt-3">
              Brez neželene pošte · Odjava kadarkoli · Samo zavestni dogodki
            </p>
          </form>
        )}

        {/* Step 2: Preferences */}
        {step === "prefs" && (
          <form onSubmit={handlePrefsSubmit} className="space-y-5">
            <div>
              <p className="text-white font-semibold text-sm mb-2.5">
                Katera področja vas zanimajo? <span className="text-emerald-300 font-normal">(izberite vse, ki veljajo)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleCategory(c.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      categories.includes(c.value)
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "bg-white/10 text-emerald-100 border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white font-semibold text-sm mb-2.5">
                V katerih mestih iščete? <span className="text-emerald-300 font-normal">(neobvezno)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {CITY_OPTIONS.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      cities.includes(city)
                        ? "bg-white text-teal-700 shadow-sm"
                        : "bg-white/10 text-emerald-100 border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    📍 {city}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-300 text-xs">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors border border-white/20"
              >
                ← Nazaj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-white hover:bg-emerald-50 disabled:bg-white/50 text-emerald-700 rounded-xl font-semibold text-sm transition-colors shadow-sm"
              >
                {loading ? "Prijavljam…" : "Prijavi se brezplačno ✓"}
              </button>
            </div>
            <p className="text-emerald-300 text-xs">
              Brezplačno · Odjava kadarkoli · Samo събития, ki vas zanimajo
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

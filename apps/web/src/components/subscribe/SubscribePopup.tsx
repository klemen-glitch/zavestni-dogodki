"use client";

import { useState, useEffect } from "react";
import { CATEGORY_OPTIONS, CITY_OPTIONS } from "./constants";

const STORAGE_KEY = "zd_popup_dismissed";
const POPUP_DELAY_MS = 35_000; // 35 seconds

export function SubscribePopup() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"email" | "prefs" | "done">("email");

  // form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Don't show if already dismissed this session
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Show after delay
    const timer = setTimeout(() => setVisible(true), POPUP_DELAY_MS);

    // Also show on exit intent (mouse leaves viewport from top)
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !sessionStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
        clearTimeout(timer);
      }
    };
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function toggleCategory(v: string) {
    setCategories((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  function toggleCity(v: string) {
    setCities((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setError("Vnesite veljaven e-mail."); return; }
    setStep("prefs");
    setError("");
  }

  async function handlePrefsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, preferences: categories, cities, source: "popup" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Napaka");
      setStep("done");
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Napaka pri prijavi");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors text-sm"
          aria-label="Zapri"
        >
          ✕
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-8 pt-8 pb-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 200 200" className="absolute -bottom-8 -right-8 w-48 h-48">
              <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1" fill="none"/>
              <circle cx="100" cy="100" r="50" stroke="white" strokeWidth="0.8" fill="none"/>
              <path d="M70 140 Q100 100 130 140 Q100 120 70 140Z" fill="white" opacity="0.4"/>
            </svg>
          </div>
          <p className="text-emerald-200 text-xs font-medium uppercase tracking-widest mb-2">Zavestni Dogodki</p>
          <h2 className="text-xl font-bold leading-snug mb-1">
            Ostanite v stiku z zavestnimi dogodki 🌿
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Brezplačen newsletter z dogodki za vaše interese in lokacijo.
          </p>
        </div>

        {/* Form body */}
        <div className="px-8 pb-8 pt-6">

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ime (neobvezno)"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Vaš e-mail naslov"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Naprej — izberite interese →
              </button>
              <p className="text-xs text-stone-400 text-center">
                Brez neželene pošte · Odjava kadarkoli
              </p>
            </form>
          )}

          {/* Step 2: Preferences */}
          {step === "prefs" && (
            <form onSubmit={handlePrefsSubmit} className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-stone-700 mb-2.5">
                  Katere prakse vas zanimajo?
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => toggleCategory(c.value)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                        categories.includes(c.value)
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-stone-50 text-stone-500 border-stone-200 hover:border-emerald-300"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-700 mb-2.5">
                  V katerih mestih iščete dogodke?
                </p>
                <div className="flex flex-wrap gap-2">
                  {CITY_OPTIONS.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => toggleCity(city)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                        cities.includes(city)
                          ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                          : "bg-stone-50 text-stone-500 border-stone-200 hover:border-teal-300"
                      }`}
                    >
                      📍 {city}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-medium text-sm transition-colors"
                >
                  ← Nazaj
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  {loading ? "Prijavlja…" : "Prijavi se brezplačno ✓"}
                </button>
              </div>
              <p className="text-xs text-stone-400 text-center">
                Preference lahko kadarkoli spremenite
              </p>
            </form>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div className="text-center py-4 space-y-3">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-bold text-stone-800">Prijavljeni ste!</h3>
              <p className="text-stone-500 text-sm leading-relaxed">
                {firstName ? `${firstName}, p` : "P"}ošiljali vam bomo samo tiste dogodke,
                ki vas resnično zanimajo.
              </p>
              <button
                onClick={dismiss}
                className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Super, hvala! 🌿
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

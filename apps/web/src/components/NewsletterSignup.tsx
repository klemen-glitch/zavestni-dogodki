"use client";
import { useState } from "react";
import { trackEvent } from "@/lib/gtag";

const CATEGORY_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "YOGA",           label: "Joga",             emoji: "🧘" },
  { value: "MEDITATION",     label: "Meditacija",       emoji: "🕊️" },
  { value: "BREATHWORK",     label: "Breathwork",       emoji: "🌬️" },
  { value: "SOUND_BATH",     label: "Zvočna kopel",     emoji: "🔔" },
  { value: "CACAO_CEREMONY", label: "Kakao ceremonija", emoji: "🍫" },
  { value: "RETREAT",        label: "Retreat",          emoji: "🏕️" },
  { value: "WORKSHOP",       label: "Delavnica",        emoji: "🛠️" },
  { value: "DANCE",          label: "Ples",             emoji: "💃" },
  { value: "TANTRA",         label: "Tantra",           emoji: "🌹" },
  { value: "HEALING",        label: "Zdravljenje",      emoji: "✨" },
  { value: "OTHER",          label: "Drugo",            emoji: "🌸" },
];

const LOCATION_OPTIONS = [
  "Vse lokacije",
  "Ljubljana",
  "Maribor",
  "Kranj",
  "Koper",
  "Celje",
  "Online",
];

export function NewsletterSignup({ compact = false, source = "newsletter_signup" }: { compact?: boolean; source?: string }) {
  const [email, setEmail] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [location, setLocation] = useState("Vse lokacije");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function toggleCategory(value: string) {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, categories, location, source }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("success");
        setMessage("Hvala! Poslali vam bomo samo zavestne dogodke, ki vas zanimajo. 🌿");
        setEmail("");
        setCategories([]);
        setLocation("Vse lokacije");
        trackEvent("newsletter_signup", { location: compact ? "compact" : "full", source });
      } else {
        setStatus("error");
        setMessage(data.error ?? "Prišlo je do napake. Prosimo, poskusite znova.");
      }
    } catch {
      setStatus("error");
      setMessage("Prišlo je do napake. Prosimo, poskusite znova.");
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Vaš email"
          className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Prijava"}
        </button>
        {message && (
          <p className={`text-xs mt-1 ${status === "error" ? "text-red-500" : "text-stone-500"}`}>
            {message}
          </p>
        )}
      </form>
    );
  }

  if (status === "success") {
    return (
      <section className="bg-gradient-to-br from-emerald-900 to-teal-800 rounded-3xl p-10 text-center text-white">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Prijavljeni ste!</h2>
        <p className="text-emerald-100 max-w-sm mx-auto">{message}</p>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-emerald-900 to-teal-800 rounded-3xl p-8 md:p-10 text-white">
      <div className="text-4xl mb-4 text-center">🌿</div>
      <h2 className="text-2xl font-bold mb-2 text-center">Prejemajte tedenski pregled</h2>
      <p className="text-emerald-200 mb-6 max-w-md mx-auto text-center text-sm leading-relaxed">
        Vsak teden kurirani seznam zavestnih dogodkov v vašem predalu. Brez spama.
      </p>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
        {/* Category checkboxes */}
        <div>
          <p className="text-sm font-semibold text-emerald-100 mb-2.5">
            Katere prakse vas zanimajo? <span className="font-normal text-emerald-300">(neobvezno)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCategory(c.value)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all border ${
                  categories.includes(c.value)
                    ? "bg-white text-emerald-800 border-white shadow-sm"
                    : "bg-white/10 text-emerald-100 border-white/20 hover:bg-white/20"
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location dropdown */}
        <div>
          <label htmlFor="newsletter-location" className="block text-sm font-semibold text-emerald-100 mb-2">
            Lokacija <span className="font-normal text-emerald-300">(neobvezno)</span>
          </label>
          <select
            id="newsletter-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 appearance-none"
          >
            {LOCATION_OPTIONS.map((loc) => (
              <option key={loc} value={loc} className="text-stone-800 bg-white">
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Email + submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vase@email.si"
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-white text-emerald-800 font-semibold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {status === "loading" ? "..." : "Prijava"}
          </button>
        </div>

        {status === "error" && <p className="text-red-300 text-sm">{message}</p>}

        <p className="text-emerald-400 text-xs text-center">
          Kadarkoli se odjavite. Zasebnost zagotovljena.
        </p>
      </form>
    </section>
  );
}

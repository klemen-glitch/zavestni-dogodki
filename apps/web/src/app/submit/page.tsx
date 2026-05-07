"use client";
import { useState } from "react";
import { ALL_CATEGORIES } from "@/lib/utils";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "@/lib/utils";

const TIERS = [
  { id: "basic", label: "Osnovna objava", price: "15 €", features: ["Objava v imeniku", "Viden 30 dni", "Email obvestilo skupnosti"] },
  { id: "featured", label: "Izpostavljena objava", price: "35 €", features: ["Vse iz osnove", "⭐ Izpostavljen na vrhu", "Vključen v newsletter", "Dlje vidljiv (60 dni)"] },
];

export default function SubmitPage() {
  const [tier, setTier] = useState<"basic" | "featured">("basic");
  const [form, setForm] = useState({ title: "", date: "", time: "", endTime: "", location: "", price: "", priceNote: "", category: "YOGA", description: "", email: "", organizerName: "", instagram: "", website: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tier }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (res.ok) {
        setStatus("success");
        setMessage("Vaša prijava je bila uspešno oddana! Preverite email za potrditev.");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Napaka pri oddaji. Prosimo, poskusite znova.");
      }
    } catch {
      setStatus("error");
      setMessage("Napaka pri oddaji. Prosimo, poskusite znova.");
    }
  }

  const input = "w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm";

  if (status === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🌿</div>
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Hvala za prijavo!</h1>
        <p className="text-stone-500">{message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Dodaj svoj dogodek</h1>
        <p className="text-stone-500">Dosezite zavestno skupnost po vsej Sloveniji</p>
      </div>

      {/* Tier selection */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {TIERS.map((t) => (
          <button key={t.id} onClick={() => setTier(t.id as "basic" | "featured")}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${tier === t.id ? "border-emerald-500 bg-emerald-50" : "border-stone-200 bg-white hover:border-stone-300"}`}>
            <p className="font-bold text-stone-800 text-lg">{t.price}</p>
            <p className="text-sm font-medium text-stone-600 mb-3">{t.label}</p>
            <ul className="space-y-1">
              {t.features.map((f) => (
                <li key={f} className="text-xs text-stone-500 flex items-center gap-1">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-8 rounded-2xl border border-stone-100">
        <h2 className="text-lg font-semibold text-stone-700">Podatki o dogodku</h2>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Naslov dogodka *</label>
          <input required className={input} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="npr. Jutranjo Vinyasa Yoga" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Datum *</label>
            <input required type="date" className={input} value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Čas začetka</label>
            <input type="time" className={input} value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Kategorija *</label>
          <select required className={input} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_EMOJI[c]} {CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Lokacija *</label>
          <input required className={input} value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="npr. Yoga Studio Ljubljana, Trubarjeva 15" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Cena (€)</label>
            <input type="number" min="0" step="0.5" className={input} value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0 = brezplačno" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Opomba o ceni</label>
            <input className={input} value={form.priceNote} onChange={e => setForm({...form, priceNote: e.target.value})} placeholder="npr. drsna lestvica" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Opis dogodka *</label>
          <textarea required rows={4} className={input} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Opišite vaš dogodek..." />
        </div>

        <hr className="border-stone-100" />
        <h2 className="text-lg font-semibold text-stone-700">Kontakt organizatorja</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Ime *</label>
            <input required className={input} value={form.organizerName} onChange={e => setForm({...form, organizerName: e.target.value})} placeholder="Vaše ime" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">Email *</label>
            <input required type="email" className={input} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="vas@email.si" />
          </div>
        </div>

        {status === "error" && <p className="text-red-500 text-sm">{message}</p>}

        <button type="submit" disabled={status === "loading"}
          className="w-full bg-emerald-700 text-white py-3 rounded-xl font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50">
          {status === "loading" ? "Pošiljam..." : `Objavi za ${tier === "featured" ? "35 €" : "15 €"} →`}
        </button>
        <p className="text-xs text-stone-400 text-center">Plačilo varno prek Stripe. Po plačilu boste preusmerjeni na potrdilo.</p>
      </form>
    </div>
  );
}

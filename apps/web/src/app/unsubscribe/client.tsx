"use client";

import { useState } from "react";

export function UnsubscribeForm({ email }: { email: string }) {
  const [emailValue, setEmailValue] = useState(email);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailValue.includes("@")) { setError("Vnesite veljaven e-mail."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Napaka");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Napaka pri odjavi");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-4 space-y-3">
        <div className="text-3xl">✅</div>
        <p className="text-stone-700 font-semibold">Uspešno odjavljeni</p>
        <p className="text-stone-400 text-sm">
          {emailValue} je bil odjavljen. Ne boste več prejemali naših emailov.
        </p>
        <a href="/" className="inline-block mt-2 text-sm text-emerald-600 hover:underline">
          ← Nazaj na domačo stran
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          E-mail naslov
        </label>
        <input
          type="email"
          value={emailValue}
          onChange={(e) => setEmailValue(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="vas@email.si"
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-stone-700 hover:bg-stone-800 disabled:bg-stone-400 text-white rounded-xl font-medium text-sm transition-colors"
      >
        {loading ? "Odjavljam…" : "Potrdi odjavo"}
      </button>
      <p className="text-center text-xs text-stone-400">
        Raje spremenite preference?{" "}
        <a href={`/preferences?email=${encodeURIComponent(emailValue)}`}
          className="text-emerald-600 hover:underline">
          Posodobite nastavitve →
        </a>
      </p>
    </form>
  );
}

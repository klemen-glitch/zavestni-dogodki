"use client";
import { useState } from "react";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Hvala! Preverite email za potrditev. 🌿");
        setEmail("");
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
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Vaš email"
          className="flex-1 px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button type="submit" disabled={status === "loading"}
          className="bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50">
          {status === "loading" ? "..." : "Naroči"}
        </button>
        {message && <p className="text-xs text-stone-500 mt-1">{message}</p>}
      </form>
    );
  }

  return (
    <section className="bg-gradient-to-br from-emerald-900 to-teal-800 rounded-3xl p-10 text-center text-white">
      <div className="text-4xl mb-4">🌿</div>
      <h2 className="text-2xl font-bold mb-2">Prejemajte tedenski pregled</h2>
      <p className="text-emerald-200 mb-6 max-w-md mx-auto">
        Vsak teden kurirani seznam zavestnih dogodkov v vašem predalu. Brez spama.
      </p>

      {status === "success" ? (
        <div className="bg-white/20 rounded-xl p-4 max-w-sm mx-auto">
          <p className="text-white font-medium">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="vase@email.si"
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button type="submit" disabled={status === "loading"}
            className="bg-white text-emerald-800 font-semibold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors disabled:opacity-50">
            {status === "loading" ? "..." : "Naroči se"}
          </button>
        </form>
      )}
      {status === "error" && <p className="text-red-300 text-sm mt-2">{message}</p>}
      <p className="text-emerald-400 text-xs mt-4">Kadarkoli se odjavite. Zasebnost zagotovljena.</p>
    </section>
  );
}

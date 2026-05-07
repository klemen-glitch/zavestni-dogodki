"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });
    if (res.ok) {
      document.cookie = `admin_token=${secret}; path=/; max-age=86400`;
      router.push(params.get("from") ?? "/admin/dashboard");
    } else {
      setError("Napačno geslo.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="bg-white rounded-2xl border border-stone-100 p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🌿</div>
          <h1 className="text-xl font-bold text-stone-800">Admin dostop</h1>
          <p className="text-stone-400 text-sm mt-1">Zavestni Dogodki Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password" required value={secret} onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin geslo (ADMIN_SECRET)"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-semibold hover:bg-emerald-800 transition-colors">
            Vstopi
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}

"use client";
import Link from "next/link";
import { useState } from "react";

const nav = [
  { href: "/events", label: "Dogodki" },
  { href: "/categories/yoga", label: "Kategorije" },
  { href: "/organizers", label: "Facilitatorji" },
  { href: "/pass", label: "Conscious Pass" },
  { href: "/submit", label: "Objavi dogodek" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-stone-100">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-800">
          <span className="text-2xl">🌿</span>
          <span className="text-lg">Zavestni Dogodki</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-stone-600">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-emerald-700 transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/submit"
          className="hidden md:inline-flex items-center gap-1 bg-emerald-700 text-white text-sm px-4 py-2 rounded-full hover:bg-emerald-800 transition-colors"
        >
          + Dodaj
        </Link>

        <button
          className="md:hidden p-2 text-stone-600"
          onClick={() => setOpen(!open)}
          aria-label="Meni"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-stone-100 bg-white px-4 py-4 flex flex-col gap-3">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className="text-stone-700 hover:text-emerald-700 py-1">
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

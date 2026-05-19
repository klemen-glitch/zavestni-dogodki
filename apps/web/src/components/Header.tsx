"use client";
import Link from "next/link";
import { useState } from "react";

const nav = [
  { href: "/events", label: "Dogodki" },
  { href: "/categories/yoga", label: "Kategorije" },
  { href: "/organizers", label: "Facilitatorji" },
  { href: "/blog", label: "Blog" },
  { href: "/pass", label: "Conscious Pass" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-stone-200/60">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-xl font-medium tracking-wide text-stone-800">Zavestni Dogodki</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-stone-500">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-stone-800 transition-colors tracking-wide">
              {n.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/submit"
          className="hidden md:inline-flex items-center gap-1 bg-brand text-white text-sm px-5 py-2 rounded-full hover:opacity-90 transition-opacity tracking-wide"
        >
          Objavi dogodek
        </Link>

        <button
          className="md:hidden p-2 text-stone-500"
          onClick={() => setOpen(!open)}
          aria-label="Meni"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-stone-100 bg-background px-4 py-4 flex flex-col gap-3">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className="text-stone-600 hover:text-brand py-1 tracking-wide">
              {n.label}
            </Link>
          ))}
          <Link href="/submit" onClick={() => setOpen(false)} className="text-brand font-medium py-1">
            Objavi dogodek →
          </Link>
        </div>
      )}
    </header>
  );
}

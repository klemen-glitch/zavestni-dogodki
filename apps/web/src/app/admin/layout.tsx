import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin · Zavestni Dogodki" } };

const nav = [
  { href: "/admin/dashboard", label: "Dashboard", emoji: "📊" },
  { href: "/admin/analytics", label: "Analytics", emoji: "📈" },
  { href: "/admin/events", label: "Dogodki", emoji: "📅" },
  { href: "/admin/facilitators", label: "Facilitatorji", emoji: "🧘" },
  { href: "/admin/newsletter", label: "Newsletter", emoji: "📧" },
  { href: "/admin/pipeline", label: "Pipeline", emoji: "⚡" },
  { href: "/admin/costs", label: "Stroški & Aplikacije", emoji: "💰" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-stone-100">
      {/* Sidebar */}
      <aside className="w-56 bg-stone-900 text-stone-300 flex flex-col">
        <div className="p-5 border-b border-stone-800">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="text-xl">🌿</span>
            <div>
              <p className="text-sm font-semibold leading-none">Zavestni Dogodki</p>
              <p className="text-xs text-stone-500 mt-0.5">Admin Panel</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-stone-800 hover:text-white transition-colors">
              <span>{n.emoji}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-stone-800">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-stone-800 hover:text-white transition-colors">
            <span>🌐</span>
            <span>Na spletno stran</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

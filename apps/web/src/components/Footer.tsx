import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 text-white font-semibold mb-3">
            <span className="text-2xl">🌿</span>
            <span>Zavestni Dogodki</span>
          </div>
          <p className="text-sm leading-relaxed">
            Vaš vodič po zavestnih dogodkih v Sloveniji — joga, meditacija, dihanje, zvočne kopeli in duhovne prireditve.
          </p>
          <p className="text-xs mt-4 text-stone-500">
            © {new Date().getFullYear()} Zavestni Dogodki. Vse pravice pridržane.
          </p>
        </div>

        <div>
          <h4 className="text-white text-sm font-medium mb-3">Dogodki</h4>
          <ul className="space-y-2 text-sm">
            {["Yoga", "Meditacija", "Dihanje", "Zvočna kopel", "Retreati"].map((cat) => (
              <li key={cat}>
                <Link href={`/events?q=${cat.toLowerCase()}`} className="hover:text-white transition-colors">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-medium mb-3">Platforma</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/submit" className="hover:text-white transition-colors">Dodaj dogodek</Link></li>
            <li><Link href="/pass" className="hover:text-white transition-colors">Conscious Pass</Link></li>
            <li><Link href="/organizers" className="hover:text-white transition-colors">Za facilitatorje</Link></li>
            <li><Link href="/api/newsletter/subscribe" className="hover:text-white transition-colors">Newsletter</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

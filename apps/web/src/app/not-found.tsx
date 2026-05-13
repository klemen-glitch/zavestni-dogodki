import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stran ni najdena",
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-7xl mb-6">🍃</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-3">
          Stran ni najdena
        </h1>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Iskana stran ne obstaja ali je bila premaknjena. Morda boste našli kar
          iščete med našimi dogodki.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/events"
            className="bg-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-800 transition-colors"
          >
            Oglej si dogodke
          </Link>
          <Link
            href="/"
            className="border border-stone-300 text-stone-700 px-6 py-3 rounded-full font-medium hover:bg-stone-50 transition-colors"
          >
            Na domačo stran
          </Link>
        </div>
      </div>
    </div>
  );
}

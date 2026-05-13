"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-7xl mb-6">🍂</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-3">
          Nekaj je šlo narobe
        </h1>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Prišlo je do nepričakovane napake. Prosimo, poskusite znova.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-800 transition-colors"
          >
            Poskusi znova
          </button>
          <a
            href="/"
            className="border border-stone-300 text-stone-700 px-6 py-3 rounded-full font-medium hover:bg-stone-50 transition-colors"
          >
            Na domačo stran
          </a>
        </div>
      </div>
    </div>
  );
}

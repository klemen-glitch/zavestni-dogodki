export default function HomeLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 animate-pulse">
      {/* Hero */}
      <section className="py-20 text-center">
        <div className="h-16 w-16 bg-stone-100 rounded-full mx-auto mb-6" />
        <div className="h-12 w-80 bg-stone-200 rounded-xl mx-auto mb-4" />
        <div className="h-6 w-96 bg-stone-100 rounded-lg mx-auto mb-8" />
        <div className="flex gap-3 justify-center">
          <div className="h-12 w-40 bg-emerald-100 rounded-full" />
          <div className="h-12 w-40 bg-stone-100 rounded-full" />
        </div>
      </section>

      {/* Featured */}
      <section className="mb-16">
        <div className="h-7 w-56 bg-stone-200 rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-stone-100 overflow-hidden"
            >
              <div className="h-44 bg-stone-100" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 bg-stone-100 rounded" />
                <div className="h-3 w-1/2 bg-stone-50 rounded" />
                <div className="h-4 w-16 bg-emerald-50 rounded mt-2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

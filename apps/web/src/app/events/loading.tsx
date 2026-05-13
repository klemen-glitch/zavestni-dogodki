export default function EventsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-56 bg-stone-200 rounded-lg mb-2" />
        <div className="h-4 w-36 bg-stone-100 rounded" />
      </div>

      {/* Search bar */}
      <div className="h-12 bg-stone-100 rounded-xl mb-4" />

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-stone-100 rounded-full" />
        ))}
      </div>

      {/* Event grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-stone-100 overflow-hidden"
          >
            <div className="h-44 bg-stone-100" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 bg-stone-100 rounded" />
              <div className="h-3 w-1/2 bg-stone-50 rounded" />
              <div className="h-3 w-2/3 bg-stone-50 rounded" />
              <div className="flex justify-between mt-2">
                <div className="h-4 w-16 bg-emerald-50 rounded" />
                <div className="h-3 w-20 bg-stone-50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

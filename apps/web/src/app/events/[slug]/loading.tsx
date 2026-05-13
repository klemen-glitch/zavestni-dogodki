export default function EventDetailLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-36 bg-stone-100 rounded mb-6" />

      {/* Image */}
      <div className="h-64 md:h-80 bg-stone-100 rounded-2xl mb-8" />

      {/* Category badge */}
      <div className="h-7 w-28 bg-stone-100 rounded-full mb-4" />

      {/* Title */}
      <div className="h-10 w-3/4 bg-stone-200 rounded-lg mb-2" />
      <div className="h-5 w-1/2 bg-stone-100 rounded mb-6" />

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-white rounded-2xl border border-stone-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-16 bg-stone-100 rounded mb-2" />
            <div className="h-5 w-32 bg-stone-200 rounded" />
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="space-y-3 mb-8">
        <div className="h-5 w-32 bg-stone-200 rounded" />
        <div className="h-4 w-full bg-stone-100 rounded" />
        <div className="h-4 w-full bg-stone-100 rounded" />
        <div className="h-4 w-5/6 bg-stone-100 rounded" />
        <div className="h-4 w-3/4 bg-stone-100 rounded" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <div className="h-10 w-44 bg-stone-100 rounded-xl" />
        <div className="h-10 w-32 bg-stone-100 rounded-xl" />
        <div className="h-10 w-36 bg-stone-100 rounded-xl" />
      </div>
    </div>
  );
}

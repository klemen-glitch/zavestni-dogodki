"use client";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(`${title} — Zavestni Dogodki`);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => alert("Povezava kopirana!"));
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-stone-500">Deli:</span>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`} target="_blank" rel="noopener"
        className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
        Facebook
      </a>
      <a href={`https://wa.me/?text=${encodedTitle}%20${encoded}`} target="_blank" rel="noopener"
        className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.998 0C5.373 0 0 5.373 0 12c0 2.117.55 4.107 1.512 5.842L.018 24l6.335-1.663A11.945 11.945 0 0011.998 24C18.623 24 24 18.627 24 12S18.623 0 11.998 0zm0 22c-1.86 0-3.607-.5-5.115-1.373l-.367-.217-3.757.986 1.004-3.654-.239-.375A9.963 9.963 0 012 12c0-5.514 4.486-10 9.998-10C17.514 2 22 6.486 22 12s-4.486 10-10.002 10z"/></svg>
        WhatsApp
      </a>
      <button onClick={copyLink}
        className="flex items-center gap-1.5 bg-stone-100 text-stone-700 text-sm px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        Kopiraj
      </button>
    </div>
  );
}

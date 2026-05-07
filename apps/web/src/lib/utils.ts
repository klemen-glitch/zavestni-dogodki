export const CATEGORY_EMOJI: Record<string, string> = {
  YOGA: "🧘", MEDITATION: "🌀", BREATHWORK: "💨", SOUND_BATH: "🎵",
  CACAO_CEREMONY: "🍫", RETREAT: "🏕️", WORKSHOP: "✨", DANCE: "💃",
  TANTRA: "🌹", HEALING: "🌿", OTHER: "🌸",
};

export const CATEGORY_LABEL: Record<string, string> = {
  YOGA: "Yoga", MEDITATION: "Meditacija", BREATHWORK: "Dihanje",
  SOUND_BATH: "Zvočna kopel", CACAO_CEREMONY: "Kakao ceremonija",
  RETREAT: "Retreat", WORKSHOP: "Delavnica", DANCE: "Ples",
  TANTRA: "Tantra", HEALING: "Zdravljenje", OTHER: "Ostalo",
};

export const CATEGORY_COLOR: Record<string, string> = {
  YOGA: "bg-emerald-100 text-emerald-800",
  MEDITATION: "bg-violet-100 text-violet-800",
  BREATHWORK: "bg-sky-100 text-sky-800",
  SOUND_BATH: "bg-amber-100 text-amber-800",
  CACAO_CEREMONY: "bg-orange-100 text-orange-800",
  RETREAT: "bg-teal-100 text-teal-800",
  WORKSHOP: "bg-indigo-100 text-indigo-800",
  DANCE: "bg-pink-100 text-pink-800",
  TANTRA: "bg-rose-100 text-rose-800",
  HEALING: "bg-lime-100 text-lime-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString("sl-SI", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Europe/Ljubljana", ...opts,
  });
}

export function formatTime(date: Date | string): string {
  const t = new Date(date).toLocaleTimeString("sl-SI", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Ljubljana",
  });
  return t === "00:00" ? "" : t;
}

export function formatPrice(price: number | null, priceNote?: string | null): string {
  if (price === 0) return "Brezplačno";
  if (price === null) return priceNote ?? "Po dogovoru";
  return `${price} €${priceNote ? ` · ${priceNote}` : ""}`;
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("sl-SI", { style: "currency", currency }).format(amount);
}

export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "pravkar";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min nazaj`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ur nazaj`;
  return `${Math.floor(seconds / 86400)} dni nazaj`;
}

export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[čć]/g, "c").replace(/[šś]/g, "s").replace(/[žź]/g, "z").replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

export function getWeekRange(offsetWeeks = 1): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff + offsetWeeks * 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export const ALL_CATEGORIES = [
  "YOGA", "MEDITATION", "BREATHWORK", "SOUND_BATH", "CACAO_CEREMONY",
  "RETREAT", "WORKSHOP", "DANCE", "TANTRA", "HEALING", "OTHER",
] as const;

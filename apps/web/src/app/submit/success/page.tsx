import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Oddaja uspešna" };

export default async function SubmitSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ submission_id?: string; session_id?: string }>;
}) {
  const { submission_id } = await searchParams;

  // Mark submission as paid if we have an ID
  if (submission_id) {
    await db.submission
      .update({ where: { id: submission_id }, data: { paid: true, status: "pending" } })
      .catch(() => {});
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-7xl mb-6">🌿</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-3">Hvala za oddajo!</h1>
        <p className="text-stone-500 mb-2 leading-relaxed">
          Vaše plačilo je bilo uspešno obdelano. Vaš dogodek bo pregledan in objavljen v kratkem.
        </p>
        <p className="text-stone-400 text-sm mb-8">
          Prejeli boste e-poštno obvestilo, ko bo vaš dogodek aktiven na platformi.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/events"
            className="bg-emerald-700 text-white px-6 py-3 rounded-full font-medium hover:bg-emerald-800 transition-colors">
            Oglej si dogodke
          </Link>
          <Link href="/submit"
            className="border border-stone-300 text-stone-700 px-6 py-3 rounded-full font-medium hover:bg-stone-50 transition-colors">
            Dodaj še en dogodek
          </Link>
        </div>
      </div>
    </div>
  );
}

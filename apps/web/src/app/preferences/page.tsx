import type { Metadata } from "next";
import { PreferencesForm } from "./client";

export const metadata: Metadata = {
  title: "Nastavitve newsletterja",
  robots: { index: false, follow: false },
};

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <span className="text-4xl">🌿</span>
          <h1 className="text-2xl font-bold text-stone-800 mt-4 mb-2">Vaše nastavitve</h1>
          <p className="text-stone-500 text-sm">
            Posodobite, katere zavestne dogodke želite prejemati.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-8 shadow-sm">
          <PreferencesForm email={email ?? ""} />
        </div>
      </div>
    </div>
  );
}

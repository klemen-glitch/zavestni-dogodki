import type { Metadata } from "next";
import { UnsubscribeForm } from "./client";

export const metadata: Metadata = {
  title: "Odjava od newsletterja",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <span className="text-4xl">🌿</span>
          <h1 className="text-2xl font-bold text-stone-800 mt-4 mb-2">Odjava od newsletterja</h1>
          <p className="text-stone-500 text-sm">
            Žal nam je, da odhajate. Vaša odjava bo takojna.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-8 shadow-sm">
          <UnsubscribeForm email={searchParams.email ?? ""} />
        </div>
      </div>
    </div>
  );
}

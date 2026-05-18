export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { timeAgo, CATEGORY_LABEL, CATEGORY_EMOJI } from "@/lib/utils";
import { FacilitatorActions } from "./client";

export const metadata: Metadata = { title: "Facilitatorji" };

async function getFacilitators() {
  return db.organizer.findMany({
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, titleSl: true, titleEn: true, category: true, date: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-stone-100 text-stone-500",
  SENT:    "bg-blue-100 text-blue-700",
  REPLIED: "bg-emerald-100 text-emerald-700",
  OPTED_OUT: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Čaka",
  SENT: "Poslano",
  REPLIED: "Odgovorili",
  OPTED_OUT: "Opt-out",
};

export default async function FacilitatorsPage() {
  const organizers = await getFacilitators();

  const stats = {
    total: organizers.length,
    researched: organizers.filter((o) => o.researchedAt).length,
    withEmail: organizers.filter((o) => o.contactEmail ?? o.email).length,
    outreachSent: organizers.filter((o) => o.outreachStatus === "SENT" || o.outreachStatus === "REPLIED").length,
  };

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Facilitatorji</h1>
        <p className="text-stone-400 text-sm mt-0.5">
          Upravljanje facilitatorjev · AI research · Dobrodošlica po e-pošti
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Skupaj", value: stats.total, icon: "🧘" },
          { label: "Researched", value: stats.researched, icon: "🔍" },
          { label: "Z e-mail", value: stats.withEmail, icon: "📧" },
          { label: "Outreach poslan", value: stats.outreachSent, icon: "✉️" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-stone-100 p-5">
            <p className="text-xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-stone-800">{s.value}</p>
            <p className="text-xs text-stone-400 uppercase tracking-wide mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-50">
          <h3 className="font-semibold text-stone-700">Vsi facilitatorji</h3>
        </div>

        <div className="divide-y divide-stone-50">
          {organizers.length === 0 && (
            <p className="text-center py-12 text-stone-300">Ni facilitatorjev v bazi.</p>
          )}

          {organizers.map((org) => {
            const email = org.contactEmail ?? org.email;
            const outreachStatus = org.outreachStatus ?? "PENDING";
            const canResearch = !org.researchedAt || true; // always allow re-research
            const canSendEmail = !!email && outreachStatus === "PENDING";

            return (
              <div key={org.id} className="px-6 py-5 hover:bg-stone-50/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">

                  {/* Avatar + name */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-50 flex-shrink-0 flex items-center justify-center border border-stone-100">
                      {org.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={org.avatarUrl}
                          alt={org.name}
                          className="w-full h-full object-cover [object-position:50%_20%]"
                        />
                      ) : (
                        <span className="text-lg font-bold text-emerald-600">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-stone-800">{org.name}</h4>
                        {org.verified && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">✓ Verificiran</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[outreachStatus] ?? STATUS_STYLE.PENDING}`}>
                          {STATUS_LABEL[outreachStatus] ?? outreachStatus}
                        </span>
                      </div>

                      {/* Contact info */}
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-stone-400">
                        {email && <span>📧 {email}</span>}
                        {(org.contactPhone ?? org.phone) && <span>📞 {org.contactPhone ?? org.phone}</span>}
                        {(org.website) && <span>🌐 {org.website}</span>}
                        {(org.instagram) && <span>📸 @{org.instagram}</span>}
                      </div>

                      {/* Events */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {org.events.map((e) => (
                          <span key={e.id}
                            className="inline-flex items-center gap-1 text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                            {CATEGORY_EMOJI[e.category]} {e.titleSl ?? e.titleEn}
                          </span>
                        ))}
                        {org.events.length === 0 && (
                          <span className="text-xs text-stone-300">Ni dogodkov</span>
                        )}
                      </div>

                      {/* Research notes */}
                      {org.researchNotes && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-xs text-amber-700 leading-relaxed">{org.researchNotes}</p>
                          {org.researchedAt && (
                            <p className="text-xs text-amber-400 mt-1">Researched {timeAgo(org.researchedAt)}</p>
                          )}
                        </div>
                      )}

                      {/* Outreach timestamp */}
                      {org.outreachSentAt && (
                        <p className="mt-1 text-xs text-stone-300">
                          Email poslan {timeAgo(org.outreachSentAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <FacilitatorActions
                    organizerId={org.id}
                    canResearch={canResearch}
                    canSendEmail={canSendEmail}
                    hasBeenResearched={!!org.researchedAt}
                  />

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

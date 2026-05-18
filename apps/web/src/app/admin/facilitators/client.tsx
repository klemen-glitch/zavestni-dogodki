"use client";

import { useState } from "react";

interface FacilitatorActionsProps {
  organizerId: string;
  canResearch: boolean;
  canSendEmail: boolean;
  hasBeenResearched: boolean;
}

export function FacilitatorActions({
  organizerId,
  canResearch,
  canSendEmail,
  hasBeenResearched,
}: FacilitatorActionsProps) {
  const [researching, setResearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [researchDone, setResearchDone] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailPreview, setEmailPreview] = useState<string | null>(null);

  async function handleResearch() {
    setResearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/facilitators/${organizerId}/research`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Research failed");
      }
      setResearchDone(true);
      // Reload page to show updated data
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Napaka pri researchu");
    } finally {
      setResearching(false);
    }
  }

  async function handleSendEmail() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/facilitators/${organizerId}/send-welcome`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Send failed");

      setEmailDone(true);
      if (body.emailHtml) {
        // Resend not configured — show preview
        setEmailPreview(body.emailHtml);
      } else {
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Napaka pri pošiljanju");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 flex-shrink-0 lg:w-48">
      {/* Research button */}
      <button
        onClick={handleResearch}
        disabled={!canResearch || researching || researchDone}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          researchDone
            ? "bg-emerald-100 text-emerald-700 cursor-default"
            : researching
            ? "bg-stone-100 text-stone-400 cursor-wait"
            : canResearch
            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            : "bg-stone-50 text-stone-300 cursor-not-allowed"
        }`}
      >
        {researchDone ? (
          <>✓ Researched</>
        ) : researching ? (
          <>
            <span className="animate-spin text-sm">⏳</span>
            Iščem…
          </>
        ) : (
          <>
            🔍 {hasBeenResearched ? "Re-research" : "Research"}
          </>
        )}
      </button>

      {/* Send welcome email button */}
      <button
        onClick={handleSendEmail}
        disabled={!canSendEmail || sending || emailDone}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          emailDone
            ? "bg-emerald-100 text-emerald-700 cursor-default"
            : sending
            ? "bg-stone-100 text-stone-400 cursor-wait"
            : canSendEmail
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            : "bg-stone-50 text-stone-300 cursor-not-allowed border border-stone-100"
        }`}
        title={!canSendEmail ? "Potrebujete e-mail naslov in status PENDING" : ""}
      >
        {emailDone ? (
          <>✓ Email poslan</>
        ) : sending ? (
          <>
            <span className="animate-spin text-sm">⏳</span>
            Pošiljam…
          </>
        ) : (
          <>✉️ Pošlji dobrodošlico</>
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 text-center mt-1">{error}</p>
      )}

      {/* Email preview modal (when Resend not configured) */}
      {emailPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEmailPreview(null)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <p className="font-semibold text-stone-700 text-sm">
                📧 Email preview (RESEND_API_KEY ni nastavljeno)
              </p>
              <button onClick={() => setEmailPreview(null)}
                className="text-stone-400 hover:text-stone-700 text-xl leading-none">×</button>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={emailPreview}
                className="w-full border-0 rounded-xl"
                style={{ height: 500 }}
                title="Email preview"
              />
            </div>
            <div className="p-4 border-t border-stone-100">
              <p className="text-xs text-stone-400 text-center">
                Kliknite zunaj okna za zaprtje · Status je bil posodobljen na SENT
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { trackEvent } from "@/lib/gtag";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Message = {
  role: "assistant",
  content: "Zdravo! 🌿 Sem vaš pomočnik na Zavestnih Dogodkih. Pomagam vam najti pravo izkušnjo — ali iščete jogo, meditacijo, zvočno kopel ali kaj drugega?",
};

const QUICK_REPLIES = [
  "Kateri dogodki so ta teden?",
  "Kako oddam svojo delavnico?",
  "Kaj je zvočna kopel?",
  "Priporoči mi retreat",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasTrackedOpen = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function send(text: string) {
    if (!text.trim() || isPending) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });
        const data = (await res.json()) as { reply?: string };
        const reply = data.reply ?? "Oprostite, prišlo je do napake.";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Oprostite, prišlo je do napake. Poskusite znova. 🙏" },
        ]);
      }
    });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
          style={{ height: "min(520px, calc(100vh - 120px))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-700 text-white flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">🌿</div>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">Zavestni Pomočnik</p>
              <p className="text-emerald-200 text-xs">Vedno na voljo</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors text-white/80 hover:text-white text-lg leading-none"
              aria-label="Zapri"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
                    🌿
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-emerald-700 text-white rounded-br-sm"
                      : "bg-white text-stone-700 border border-stone-100 shadow-sm rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
                  🌿
                </div>
                <div className="bg-white border border-stone-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies — show only on first message */}
          {messages.length === 1 && !isPending && (
            <div className="px-4 pb-2 bg-stone-50 flex flex-wrap gap-1.5 flex-shrink-0">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-stone-100 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Napišite sporočilo..."
              disabled={isPending}
              className="flex-1 px-3.5 py-2 rounded-full border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isPending}
              className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-800 transition-colors disabled:opacity-40 flex-shrink-0"
              aria-label="Pošlji"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21L23 12 2 3v7l15 2-15 2v7z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && !hasTrackedOpen.current) {
            hasTrackedOpen.current = true;
            trackEvent("chat_open");
          }
        }}
        className="fixed bottom-5 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label={open ? "Zapri pomočnika" : "Odpri pomočnika"}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )}
        {/* Unread dot — only shows when closed */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full border-2 border-white text-[9px] font-bold text-amber-900 flex items-center justify-center">
            1
          </span>
        )}
      </button>
    </>
  );
}

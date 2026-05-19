"use client";
import { useState, useEffect, useCallback } from "react";
import { NewsletterSignup } from "./NewsletterSignup";

const STORAGE_KEY = "popup_dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHOW_DELAY_MS = 30_000; // 30 seconds
const SCROLL_THRESHOLD = 0.6; // 60% scroll depth

export function NewsletterPopup() {
  const [visible, setVisible] = useState(false);

  const shouldShow = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;
    const dismissedAt = parseInt(stored, 10);
    return Date.now() - dismissedAt > DISMISS_DURATION_MS;
  }, []);

  const show = useCallback(() => {
    if (shouldShow()) setVisible(true);
  }, [shouldShow]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  useEffect(() => {
    if (!shouldShow()) return;

    // Show after 30 seconds
    const timer = setTimeout(show, SHOW_DELAY_MS);

    // Show when user scrolls 60% down
    function onScroll() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (scrolled / total >= SCROLL_THRESHOLD) {
        show();
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [show, shouldShow]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className="fixed inset-0 z-40 bg-black/30 sm:hidden"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Popup panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Prijava na newsletter"
        className={[
          "fixed z-50",
          // Desktop: bottom-right corner
          "sm:bottom-6 sm:right-6 sm:max-w-sm sm:w-full",
          // Mobile: bottom sheet, full width
          "bottom-0 left-0 right-0 sm:left-auto",
          // Slide-in animation
          "animate-slide-up",
          "rounded-t-3xl sm:rounded-3xl",
          "shadow-2xl overflow-hidden",
        ].join(" ")}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-700 to-teal-700 px-6 pt-6 pb-4 relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white/80 hover:text-white transition-colors text-sm"
            aria-label="Zapri"
          >
            ✕
          </button>
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">
            Brezplačno
          </p>
          <h2 className="text-base font-bold text-white leading-snug">
            Ostani v stiku z zavestno skupnostjo 🌿
          </h2>
          <p className="text-emerald-100 text-xs mt-1 leading-relaxed">
            Personalizirani dogodki direktno v tvoj nabiralnik.
          </p>
        </div>

        {/* Form body */}
        <div className="bg-white px-6 py-5">
          <NewsletterSignup compact source="popup" />
          <p className="text-xs text-stone-400 text-center mt-3">
            Odjava kadarkoli · Brez spama
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
    </>
  );
}

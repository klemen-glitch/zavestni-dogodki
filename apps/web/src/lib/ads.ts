/**
 * Static partner ads for the events listing.
 * In the future these will be DB-driven with an admin UI.
 */

export interface PartnerAd {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  href: string;
  emoji: string;
  colorFrom: string;
  colorTo: string;
  tag: string;
}

export const PARTNER_ADS: PartnerAd[] = [
  {
    id: "ad-1",
    title: "Objavi svoj wellness event",
    subtitle: "Zavestni Dogodki · Partner",
    description: "Dosezite skupnost tisočih zavestnih iskalcev po Sloveniji. Objava BREZPLAČNA ob otvoritvi.",
    cta: "Dodaj dogodek →",
    href: "/submit",
    emoji: "🌿",
    colorFrom: "#2d6a4f",
    colorTo: "#1b4332",
    tag: "Objava dogodkov",
  },
  {
    id: "ad-2",
    title: "Yoga Studio Ljubljana",
    subtitle: "Partnerski prostor",
    description: "Opremljeni studio v centru Ljubljane z naravno svetlobo. Najem po urah za delavnice in tečaje.",
    cta: "Rezerviraj prostor →",
    href: "https://zavestnidogodki.si/submit",
    emoji: "🧘",
    colorFrom: "#059669",
    colorTo: "#064e3b",
    tag: "Najem prostora",
  },
  {
    id: "ad-3",
    title: "Hiša Miru — Retreati",
    subtitle: "Partnerski retreat center",
    description: "Naravno okolje Bohinja za vaše retreate in delavnice. Nastanitev do 20 oseb, polpenzion.",
    cta: "Spoznaj nas →",
    href: "https://zavestnidogodki.si/submit",
    emoji: "🏕️",
    colorFrom: "#0d9488",
    colorTo: "#134e4a",
    tag: "Retreat center",
  },
  {
    id: "ad-4",
    title: "Zavestni Newsletter",
    subtitle: "Ostanite obveščeni",
    description: "Tedenski pregled zavestnih dogodkov, nasveti za prakso in navdih — direktno v vaš inbox.",
    cta: "Prijavi se brezplačno →",
    href: "/#newsletter",
    emoji: "📧",
    colorFrom: "#7c3aed",
    colorTo: "#4c1d95",
    tag: "Newsletter",
  },
];

export function getAdForPosition(position: number): PartnerAd {
  return PARTNER_ADS[position % PARTNER_ADS.length];
}

/**
 * Demo: Feed a messy Facebook post through the AI processor.
 * Run: npx ts-node src/demo.ts
 */

import "dotenv/config";
import { processPost } from "./processor";
import type { RawFacebookPost } from "./types";

// ── Simulated raw FB post (messy, Slovenian, real-world example) ─────────────
const DUMMY_CACAO_POST: RawFacebookPost = {
  authorName: "Ana Kovač",
  postedAt: "2026-06-10T09:15:00+02:00",
  postUrl: "https://www.facebook.com/groups/19s8ds6nJx/posts/fake123",
  text: `
🌺✨ KAKAO CEREMONIJA & MEDITACIJA ✨🌺

Dragi prijatelji,

vabim vas na posebno srečanje - kakao ceremonijo z meditacijo in zvočno kopeljo!

🗓️ Kdaj: sobota, 21. junija 2026 ob 18:00 do 20:30
📍 Kjer: Yoga studio Svetloba, Trubarjeva 15, Ljubljana
💰 Prispevek: 25€ (zgodnja prijava do 15.6.) ali 30€ na dan

V krogu bomo skupaj odprli srca s ceremonialnim kakaom iz Gvatemale 🇬🇹
Sledila bo vodena meditacija in zvočna kopel z peti skledicami.

Število mest je omejeno na 15 udeležencev!
Prosim prijavite se na: ana.kovac.healing@gmail.com ali @anakovacyoga na instagramu

S ljubeznijo, Ana 💚
  `.trim(),
};

async function main() {
  console.log("🧠 Conscious Slovenia — AI Processor Demo\n");
  console.log("📥 Input (raw Facebook post):");
  console.log("─".repeat(60));
  console.log(DUMMY_CACAO_POST.text);
  console.log("─".repeat(60));
  console.log("\n⏳ Processing with Claude...\n");

  const result = await processPost(DUMMY_CACAO_POST);

  if (!result.success || !result.event) {
    console.error("❌ Processing failed:", result.error);
    process.exit(1);
  }

  console.log("✅ Extracted Event JSON:");
  console.log("─".repeat(60));
  console.log(JSON.stringify(result.event, null, 2));
  console.log("─".repeat(60));
  console.log(`\n📊 Tokens used:   ${result.tokensUsed}`);
  console.log(`💾 Cached tokens: ${result.cachedTokens}`);
  console.log(`🎯 Confidence:    ${(result.event.confidence * 100).toFixed(0)}%`);
}

main().catch(console.error);

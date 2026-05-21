/**
 * One-time Facebook login helper.
 *
 * Run this ONCE to create a saved browser session.
 * After this, the daily scraper reuses the session automatically — no login needed.
 *
 * Usage:
 *   node scripts/fb-login-once.mjs
 *
 * What it does:
 *   1. Opens a Chrome window (not headless) with Facebook login page
 *   2. You log in manually
 *   3. Script polls until it detects session cookies (c_user + xs)
 *   4. Saves the session to packages/scraper/auth/facebook-state.json
 *   5. That file is reused by the daily scraper for months
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const AUTH_PATH = resolve(ROOT, "packages/scraper/auth/facebook-state.json");

mkdirSync(resolve(ROOT, "packages/scraper/auth"), { recursive: true });

console.log("📋 Opening Chrome for Facebook login...");
console.log("   Log in to Facebook in the Chrome window that opens.");
console.log("   Use your email + password (no Google OAuth needed).\n");

const browser = await chromium.launch({
  channel: "chrome",
  headless: false,
  args: ["--start-maximized"],
});

const context = await browser.newContext({ viewport: null });
const page = await context.newPage();

// Go directly to the login page to avoid the "already logged in" false positive
await page.goto("https://www.facebook.com/login", { waitUntil: "domcontentloaded" });

console.log("⏳ Waiting for you to log in (polling for session cookies, up to 5 min)...");
console.log("   The Chrome window should be visible. Log in, then wait a moment.\n");

// Poll for session cookies instead of watching URL — avoids false positives
// where facebook.com/ passes a URL check but has no session
const SESSION_COOKIES = ["c_user", "xs"];
const TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL = 2000;
const start = Date.now();
let allCookies = [];

while (Date.now() - start < TIMEOUT_MS) {
  await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  try {
    allCookies = await context.cookies("https://www.facebook.com");
    const hasSession = SESSION_COOKIES.every((name) => allCookies.some((c) => c.name === name));
    if (hasSession) {
      console.log("✓ Session cookies detected!");
      break;
    }
  } catch {
    // context may have been closed by user — bail out
    break;
  }
}

try { await browser.close(); } catch {}

const fbCookies = allCookies.filter(
  (c) => c.domain?.includes("facebook.com") || c.domain?.includes("fbcdn.net")
);

if (!SESSION_COOKIES.every((name) => fbCookies.some((c) => c.name === name))) {
  console.error("❌ Session incomplete — c_user or xs cookie missing.");
  console.error("   Make sure you completed the login before closing the window.");
  process.exit(1);
}

writeFileSync(AUTH_PATH, JSON.stringify({ cookies: allCookies, origins: [] }, null, 2));

const cUser = fbCookies.find((c) => c.name === "c_user");
console.log(`\n✅ Session saved (${allCookies.length} cookies) to:`);
console.log(`   ${AUTH_PATH}`);
if (cUser) console.log(`\n👤 Logged in as Facebook user ID: ${cUser.value}`);
console.log("\n🎉 The daily scraper will now use this session automatically.");
console.log("   Valid for ~3 months. When it expires, run this script again.");

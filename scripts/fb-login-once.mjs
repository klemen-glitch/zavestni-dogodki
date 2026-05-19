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
 *   1. Opens a Chrome window (not headless) with Facebook login
 *   2. You log in manually (supports Google OAuth, 2FA, etc.)
 *   3. Saves the session to packages/scraper/auth/facebook-state.json
 *   4. That file is reused by the daily scraper for months
 */

import { chromium } from "playwright";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const AUTH_PATH = resolve(ROOT, "packages/scraper/auth/facebook-state.json");

console.log("📋 Opening Chrome for Facebook login...");
console.log("   Log in to Facebook in the Chrome window that opens.");
console.log("   Supports Google OAuth, 2FA, etc. — just log in as you normally would.\n");

mkdirSync(resolve(ROOT, "packages/scraper/auth"), { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: false,
  args: ["--start-maximized"],
});

const context = await browser.newContext({ viewport: null });
const page = await context.newPage();
await page.goto("https://www.facebook.com/");

// Check if already on a non-login URL (session still valid)
const isLoggedIn = (url) => {
  const h = url.href;
  return (
    h.includes("facebook.com") &&
    !h.includes("/login") &&
    !h.includes("/checkpoint") &&
    !h.includes("/two_factor") &&
    !h.includes("/two_step_verification") &&
    !h.includes("/identity_confirmation") &&
    !h.includes("/recover") &&
    !h.includes("google.com") &&
    !h.includes("accounts.")
  );
};

if (!isLoggedIn(new URL(page.url()))) {
  console.log("⏳ Waiting for you to log in (up to 5 minutes)...");
  console.log("   The Chrome window should be visible on your screen.\n");
  try {
    await page.waitForURL(isLoggedIn, { timeout: 300_000 });
  } catch {
    console.error("❌ Timed out after 5 minutes. Run the script again.");
    await browser.close();
    process.exit(1);
  }
}

await page.waitForTimeout(3000);
console.log(`✓ Logged in at: ${page.url()}`);

const allCookies = await context.cookies();
const fbCookies = allCookies.filter(
  (c) => c.domain?.includes("facebook.com") || c.domain?.includes("fbcdn.net")
);

await browser.close();

if (!fbCookies.some((c) => c.name === "c_user") || !fbCookies.some((c) => c.name === "xs")) {
  console.error("❌ Session incomplete — missing c_user or xs cookie. Try again.");
  process.exit(1);
}

writeFileSync(AUTH_PATH, JSON.stringify({ cookies: allCookies, origins: [] }, null, 2));

const cUser = fbCookies.find((c) => c.name === "c_user");
console.log(`\n✅ Session saved (${allCookies.length} cookies) to:`);
console.log(`   ${AUTH_PATH}`);
if (cUser) console.log(`\n👤 Logged in as Facebook user: ${cUser.value}`);
console.log("\n🎉 The daily scraper will now use this session automatically.");
console.log("   It stays valid for ~3 months. When it expires, just run this script again.");

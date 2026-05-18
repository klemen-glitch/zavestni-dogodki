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
 *   1. Opens a real Chrome browser window (not headless)
 *   2. Navigates to facebook.com/login
 *   3. Fills in your email + password from .env
 *   4. Waits for YOU to complete 2FA if needed
 *   5. Saves the session to packages/scraper/auth/facebook-state.json
 *   6. That file is reused by the daily scraper for months
 */

import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load .env manually
const envPath = resolve(ROOT, ".env");
const envContent = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")];
    })
);

const EMAIL = env.FB_EMAIL;
const PASSWORD = env.FB_PASSWORD;
const AUTH_PATH = resolve(ROOT, "packages/scraper/auth/facebook-state.json");

if (!EMAIL || EMAIL === "your@email.com") {
  console.error("❌ Set FB_EMAIL in your .env file first");
  process.exit(1);
}
if (!PASSWORD || PASSWORD === "your-facebook-password") {
  console.error("❌ Set FB_PASSWORD in your .env file first");
  process.exit(1);
}

import os from "os";

const CHROME_PROFILE = resolve(os.homedir(), "Library/Application Support/Google/Chrome");

console.log("📋 Opening Chrome with your existing profile...");
console.log("   (Make sure Chrome is fully closed / Cmd+Q before this runs)\n");

mkdirSync(resolve(ROOT, "packages/scraper/auth"), { recursive: true });

// Launch Chrome with the user's real profile — already logged in to Facebook
const context = await chromium.launchPersistentContext(CHROME_PROFILE, {
  channel: "chrome",
  headless: false,
  args: ["--start-maximized"],
});

const page = await context.newPage();
await page.goto("https://www.facebook.com/");

console.log("⏳ Waiting for Facebook feed to load (up to 30 seconds)...");

// Wait until we see the FB feed — not a login page
try {
  await page.waitForURL(
    (url) =>
      url.href.includes("facebook.com") &&
      !url.href.includes("/login") &&
      !url.href.includes("/checkpoint") &&
      !url.href.includes("google.com"),
    { timeout: 30_000 }
  );
} catch {
  // If still on login/google page after 30s, wait extra 60s for manual action
  console.log("⚠️  Not logged in automatically — you have 60 seconds to log in manually in the browser window...");
  await page.waitForURL(
    (url) =>
      url.href.includes("facebook.com") &&
      !url.href.includes("/login") &&
      !url.href.includes("google.com"),
    { timeout: 60_000 }
  );
}

await page.waitForTimeout(3000);

// Extra wait to ensure all cookies are set
await page.waitForTimeout(2000);

// Save session
await context.storageState({ path: AUTH_PATH });
await browser.close();

console.log("✅ Login successful! Session saved to:");
console.log(`   ${AUTH_PATH}`);
console.log("\n🎉 The daily scraper will now use this session automatically.");
console.log("   It stays valid for ~3 months. When it expires, just run this script again.");

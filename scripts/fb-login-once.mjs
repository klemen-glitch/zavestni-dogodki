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

console.log("🌐 Opening browser — log in to Facebook in the window that appears");
console.log("   If 2FA appears, complete it manually. The script waits for you.\n");

mkdirSync(resolve(ROOT, "packages/scraper/auth"), { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--start-maximized"],
});

const context = await browser.newContext({
  viewport: null,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

const page = await context.newPage();

await page.goto("https://www.facebook.com/login");
await page.waitForLoadState("networkidle");

// Fill credentials
await page.fill("#email", EMAIL);
await page.fill("#pass", PASSWORD);
await page.click('[name="login"]');

console.log("✏️  Credentials submitted — waiting for you to complete 2FA if needed...");
console.log("   (You have 2 minutes. If no 2FA, this completes automatically.)\n");

// Wait until we're no longer on the login page (up to 2 minutes for 2FA)
try {
  await page.waitForURL((url) => !url.href.includes("/login"), {
    timeout: 120_000,
  });
} catch {
  console.error("❌ Still on login page after 2 minutes — check your credentials or complete 2FA faster");
  await browser.close();
  process.exit(1);
}

// Extra wait to ensure all cookies are set
await page.waitForTimeout(2000);

// Save session
await context.storageState({ path: AUTH_PATH });
await browser.close();

console.log("✅ Login successful! Session saved to:");
console.log(`   ${AUTH_PATH}`);
console.log("\n🎉 The daily scraper will now use this session automatically.");
console.log("   It stays valid for ~3 months. When it expires, just run this script again.");

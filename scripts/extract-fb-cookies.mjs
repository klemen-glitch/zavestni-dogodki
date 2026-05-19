/**
 * Extracts Facebook cookies directly from Chrome's SQLite database.
 * Uses macOS Keychain to decrypt them, no Playwright profile launch needed.
 *
 * Usage: node scripts/extract-fb-cookies.mjs
 */

import { createDecipheriv, pbkdf2Sync } from "crypto";
import { execSync, spawnSync } from "child_process";
import { copyFileSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import os from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const AUTH_PATH = resolve(ROOT, "packages/scraper/auth/facebook-state.json");
const CHROME_COOKIES = resolve(
  os.homedir(),
  "Library/Application Support/Google/Chrome/Default/Cookies"
);
const TEMP_COOKIES = `/tmp/chrome-cookies-extract-${Date.now()}.db`;

// ── 1. Get Chrome's encryption key from macOS Keychain ────────────────────────
let chromePassword;
try {
  chromePassword = execSync(
    'security find-generic-password -s "Chrome Safe Storage" -a "Chrome" -w',
    { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  ).trim();
} catch (e) {
  console.error("❌ Could not read Chrome Safe Storage from Keychain:", e.message);
  process.exit(1);
}

// Derive AES key: PBKDF2-SHA1, salt='saltysalt', iterations=1003, keylen=16
const key = pbkdf2Sync(chromePassword, "saltysalt", 1003, 16, "sha1");

function decryptChromeValue(encryptedBuf) {
  if (!encryptedBuf || encryptedBuf.length === 0) return "";
  const prefix = encryptedBuf.subarray(0, 3).toString("ascii");
  if (prefix === "v10" || prefix === "v11") {
    const iv = Buffer.alloc(16, 0x20); // 16 space characters
    const ciphertext = encryptedBuf.subarray(3);
    const decipher = createDecipheriv("aes-128-cbc", key, iv);
    decipher.setAutoPadding(true);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  }
  // Unencrypted fallback
  return encryptedBuf.toString("utf8");
}

// ── 2. Copy DB to temp (Chrome may hold a lock) ───────────────────────────────
copyFileSync(CHROME_COOKIES, TEMP_COOKIES);

// ── 3. Query Facebook cookies from the copy ───────────────────────────────────
const query = `
  SELECT name, host_key, path, is_secure, is_httponly, expires_utc, encrypted_value, samesite
  FROM cookies
  WHERE host_key LIKE '%facebook.com%'
  ORDER BY host_key, name;
`;

const result = spawnSync("sqlite3", ["-separator", "\t", TEMP_COOKIES, query], {
  encoding: "buffer",
});

unlinkSync(TEMP_COOKIES);

if (result.status !== 0) {
  console.error("❌ sqlite3 failed:", result.stderr?.toString());
  process.exit(1);
}

const rows = result.stdout.toString("utf8").trim().split("\n").filter(Boolean);

// Chrome's expires_utc is microseconds since Jan 1, 1601
// Convert to Unix seconds: subtract epochs and convert units
function chromeTimeToUnix(chromeTime) {
  if (!chromeTime || chromeTime === "0") return -1;
  const epoch_diff = 11644473600; // seconds between 1601-01-01 and 1970-01-01
  return Math.floor(Number(chromeTime) / 1_000_000) - epoch_diff;
}

const sameSiteMap = { "-1": "Unspecified", "0": "None", "1": "Lax", "2": "Strict" };

const cookies = [];
let decryptErrors = 0;

for (const row of rows) {
  const parts = row.split("\t");
  if (parts.length < 8) continue;

  const [name, domain, path_, isSecure, isHttpOnly, expiresChrome, encryptedHex, sameSiteRaw] = parts;

  // sqlite3 returns BLOB as hex when using -separator mode
  const encryptedBuf = Buffer.from(encryptedHex, "hex");

  let value = "";
  try {
    value = decryptChromeValue(encryptedBuf);
  } catch (e) {
    decryptErrors++;
    continue;
  }

  const expires = chromeTimeToUnix(expiresChrome);

  cookies.push({
    name,
    value,
    domain,
    path: path_,
    expires,
    httpOnly: isHttpOnly === "1",
    secure: isSecure === "1",
    sameSite: sameSiteMap[sameSiteRaw] ?? "Unspecified",
  });
}

// ── 4. Save as Playwright storageState ───────────────────────────────────────
mkdirSync(resolve(ROOT, "packages/scraper/auth"), { recursive: true });

const storageState = { cookies, origins: [] };
writeFileSync(AUTH_PATH, JSON.stringify(storageState, null, 2));

console.log(`✅ Saved ${cookies.length} Facebook cookies to:`);
console.log(`   ${AUTH_PATH}`);
if (decryptErrors > 0) console.log(`   (${decryptErrors} cookies failed to decrypt — skipped)`);

// Show key cookies present
const keyNames = ["c_user", "xs", "datr", "sb", "fr"];
const found = keyNames.filter((n) => cookies.some((c) => c.name === n));
const missing = keyNames.filter((n) => !cookies.some((c) => c.name === n));
console.log(`\n🔑 Key cookies: ${found.join(", ")} ✓`);
if (missing.length > 0) console.log(`⚠️  Missing: ${missing.join(", ")}`);

const cUser = cookies.find((c) => c.name === "c_user");
if (cUser) console.log(`\n👤 Logged in as Facebook user: ${cUser.value}`);

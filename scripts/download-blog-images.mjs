/**
 * Downloads all Pollinations.ai blog images to public/images/blog/
 * and rewrites blog-posts.ts to use stable local paths.
 *
 * Run once: node scripts/download-blog-images.mjs
 */

import { readFileSync, writeFileSync, createWriteStream, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BLOG_POSTS_PATH = resolve(ROOT, "apps/web/src/content/blog-posts.ts");
const PUBLIC_DIR = resolve(ROOT, "apps/web/public/images/blog");

mkdirSync(PUBLIC_DIR, { recursive: true });

// Download a URL to a local file, follow redirects
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = createWriteStream(dest);
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", reject);
  });
}

// Extract all imageUrl entries with their surrounding context
// Returns array of { url, slug, index }
function extractImageEntries(source) {
  const entries = [];

  // Find each slug block and its imageUrls
  const slugMatches = [...source.matchAll(/slug:\s*["']([^"']+)["']/g)];

  for (let si = 0; si < slugMatches.length; si++) {
    const slug = slugMatches[si][1];
    const blockStart = slugMatches[si].index;
    const blockEnd = si + 1 < slugMatches.length ? slugMatches[si + 1].index : source.length;
    const block = source.slice(blockStart, blockEnd);

    const imgMatches = [...block.matchAll(/imageUrl:\s*["'](https:\/\/[^"']+)["']/g)];
    imgMatches.forEach((m, idx) => {
      entries.push({ url: m[1], slug, index: idx });
    });
  }

  return entries;
}

const source = readFileSync(BLOG_POSTS_PATH, "utf8");
const entries = extractImageEntries(source);

console.log(`Found ${entries.length} images to download\n`);

let updatedSource = source;

for (const { url, slug, index } of entries) {
  const localName = `${slug}-${index}.jpg`;
  const localPath = resolve(PUBLIC_DIR, localName);
  const publicUrl = `/images/blog/${localName}`;

  process.stdout.write(`  Downloading ${slug}[${index}]... `);

  try {
    await download(url, localPath);
    console.log(`✓ saved`);

    // Replace the URL in source — quote-safe replacement
    updatedSource = updatedSource.replace(
      new RegExp(`imageUrl:\\s*["']${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`),
      `imageUrl: "${publicUrl}"`
    );
  } catch (err) {
    console.log(`✗ failed (${err.message}) — keeping original URL`);
  }
}

writeFileSync(BLOG_POSTS_PATH, updatedSource, "utf8");
console.log(`\n✅ blog-posts.ts updated with ${entries.length} local image paths`);
console.log(`   Images saved to: apps/web/public/images/blog/`);

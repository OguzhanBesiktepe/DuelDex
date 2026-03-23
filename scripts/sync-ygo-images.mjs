// scripts/sync-ygo-images.mjs
// Downloads all YGO card images from YGOPRODeck and uploads to Cloudflare R2.
// Safe to re-run — skips images already uploaded using a local cache file.
//
// Run with:
//   node --env-file=.env.local scripts/sync-ygo-images.mjs

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { existsSync, readFileSync, writeFileSync } from "fs";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const CACHE_FILE = "scripts/.synced-ids.json";

// Load previously synced IDs so re-runs skip already-uploaded images
const synced = new Set(
  existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : []
);

async function existsInR2(key) {
  try {
    await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadToR2(key, buffer, contentType) {
  await R2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url} — status ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log("Fetching full card list from YGOPRODeck...");
  const res = await fetch("https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes");
  if (!res.ok) throw new Error("Failed to fetch card list from YGOPRODeck");
  const json = await res.json();
  const cards = json.data;
  console.log(`Found ${cards.length} cards. Starting image sync...\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const card of cards) {
    for (const img of card.card_images) {
      const id = String(img.id);

      if (synced.has(id)) {
        skipped++;
        continue;
      }

      const fullKey = `ygo/${id}.jpg`;
      const smallKey = `ygo/${id}_small.jpg`;

      try {
        if (!(await existsInR2(fullKey))) {
          const buf = await downloadImage(img.image_url);
          await uploadToR2(fullKey, buf, "image/jpeg");
        }

        if (!(await existsInR2(smallKey))) {
          const buf = await downloadImage(img.image_url_small);
          await uploadToR2(smallKey, buf, "image/jpeg");
        }

        synced.add(id);
        uploaded++;

        // Save progress every 50 uploads so a crash doesn't lose everything
        if (uploaded % 50 === 0) {
          writeFileSync(CACHE_FILE, JSON.stringify([...synced]));
          console.log(`Progress — uploaded: ${uploaded}, skipped: ${skipped}, failed: ${failed}`);
        }

        await sleep(100); // ~10 req/sec, well under YGOPRODeck's 20/sec limit
      } catch (err) {
        console.error(`  Failed image id ${id}: ${err.message}`);
        failed++;
      }
    }
  }

  writeFileSync(CACHE_FILE, JSON.stringify([...synced]));
  console.log(`\nDone! Uploaded: ${uploaded} | Skipped: ${skipped} | Failed: ${failed}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

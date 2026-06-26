#!/usr/bin/env node
/**
 * Batch-generate Amorely pet PNG assets via OpenAI Images API.
 *
 * Usage:
 *   set OPENAI_API_KEY=sk-...
 *   node scripts/generate-pet-images.mjs              # all 90 images
 *   node scripts/generate-pet-images.mjs --only kitten/orange/level-1.png
 *   node scripts/generate-pet-images.mjs --from kitten/orange/level-1.png
 *   node scripts/generate-pet-images.mjs --dry-run
 *
 * Requires: Node 18+, OPENAI_API_KEY in environment.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildAllJobs } from './pet-image-prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = path.join(__dirname, '../client/public/pets');
const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const SIZE = process.env.PET_IMAGE_SIZE || '1024x1536';
const DELAY_MS = Number(process.env.PET_IMAGE_DELAY_MS || 3000);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyIdx = args.indexOf('--only');
const fromIdx = args.indexOf('--from');
const onlyFilter = onlyIdx >= 0 ? args[onlyIdx + 1] : null;
const fromFilter = fromIdx >= 0 ? args[fromIdx + 1] : null;

const apiKey = process.env.OPENAI_API_KEY;
if (!dryRun && !apiKey) {
  console.error('Missing OPENAI_API_KEY. Set it or use --dry-run to preview jobs.');
  process.exit(1);
}

let jobs = buildAllJobs();
if (onlyFilter) {
  jobs = jobs.filter((j) => j.outPath === onlyFilter || j.outPath.endsWith(onlyFilter));
}
if (fromFilter) {
  const start = jobs.findIndex((j) => j.outPath === fromFilter || j.outPath.endsWith(fromFilter));
  if (start >= 0) jobs = jobs.slice(start);
}

console.log(`Pet image generation: ${jobs.length} jobs → ${OUT_ROOT}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateOne(job) {
  const fullPath = path.join(OUT_ROOT, job.outPath);
  if (fs.existsSync(fullPath) && !args.includes('--force')) {
    console.log(`  skip (exists): ${job.outPath}`);
    return;
  }

  if (dryRun) {
    console.log(`\n[DRY] ${job.outPath}\n  ${job.prompt.slice(0, 120)}...`);
    return;
  }

  console.log(`  generating: ${job.outPath}`);

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: job.prompt,
      n: 1,
      size: SIZE,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const item = data.data?.[0];
  let buffer;

  if (item?.b64_json) {
    buffer = Buffer.from(item.b64_json, 'base64');
  } else if (item?.url) {
    const imgRes = await fetch(item.url);
    buffer = Buffer.from(await imgRes.arrayBuffer());
  } else {
    throw new Error('No image data in response');
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, buffer);
  console.log(`  saved: ${job.outPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  let ok = 0;
  let fail = 0;

  for (const job of jobs) {
    try {
      await generateOne(job);
      ok++;
    } catch (err) {
      fail++;
      console.error(`  FAILED ${job.outPath}:`, err.message);
      if (args.includes('--stop-on-error')) process.exit(1);
    }
    if (!dryRun && DELAY_MS > 0) await sleep(DELAY_MS);
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed`);
}

main();

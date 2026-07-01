#!/usr/bin/env node
/**
 * Batch-optimize all pet PNGs in client/public/pets → WebP.
 *
 * Usage:
 *   node scripts/optimize-pet-images.mjs
 *   node scripts/optimize-pet-images.mjs --delete-png
 *   node scripts/optimize-pet-images.mjs --only kitten/orange/level-1.png
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { optimizePetImage } from './pet-image-optimize.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PETS_ROOT = path.join(__dirname, '../client/public/pets');

const args = process.argv.slice(2);
const deletePng = args.includes('--delete-png');
const onlyIdx = args.indexOf('--only');
const onlyFilter = onlyIdx >= 0 ? args[onlyIdx + 1] : null;

function collectPngs(dir) {
  /** @type {string[]} */
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPngs(full));
    } else if (entry.name.endsWith('.png')) {
      results.push(full);
    }
  }
  return results;
}

let files = collectPngs(PETS_ROOT);
if (onlyFilter) {
  files = files.filter(
    (f) => f.includes(onlyFilter) || path.relative(PETS_ROOT, f) === onlyFilter.replace(/\\/g, '/')
  );
}

if (files.length === 0) {
  console.log('No PNG files found to optimize.');
  process.exit(0);
}

console.log(`Optimizing ${files.length} pet images → WebP (max ${process.env.PET_IMAGE_MAX_DIMENSION || 768}px)`);

let totalBefore = 0;
let totalAfter = 0;

for (const pngPath of files) {
  const rel = path.relative(PETS_ROOT, pngPath);
  try {
    const { bytesBefore, bytesAfter } = await optimizePetImage(pngPath, { removeSource: deletePng });
    totalBefore += bytesBefore;
    totalAfter += bytesAfter;
    console.log(
      `  ${rel} → ${rel.replace(/\.png$/i, '.webp')}  ${(bytesBefore / 1024).toFixed(0)} KB → ${(bytesAfter / 1024).toFixed(0)} KB`
    );
  } catch (err) {
    console.error(`  FAILED ${rel}:`, err.message);
  }
}

console.log(
  `\nDone: ${(totalBefore / 1024 / 1024).toFixed(1)} MB → ${(totalAfter / 1024 / 1024).toFixed(1)} MB (${((1 - totalAfter / totalBefore) * 100).toFixed(0)}% smaller)`
);

#!/usr/bin/env node
/** Copy generated refs from assets/ → client/public/pets/ by naming convention. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS =
  process.env.PET_ASSETS_DIR ||
  (fs.existsSync(path.join(__dirname, '../assets'))
    ? path.join(__dirname, '../assets')
    : 'C:/Users/office_user2/.cursor/projects/c-Projects-Amorely/assets');
const OUT = path.join(__dirname, '../client/public/pets');

const files = fs.readdirSync(ASSETS).filter((f) => f.endsWith('.png'));

let copied = 0;

for (const file of files) {
  const base = file.replace(/-ref\.png$/, '').replace(/\.png$/, '');
  const eggMatch = base.match(/^([a-z]+)-([a-z]+)-egg$/);
  const levelMatch = base.match(/^([a-z]+)-([a-z]+)-level-(\d+)$/);

  if (eggMatch) {
    const [, species, variant] = eggMatch;
    const dest = path.join(OUT, species, variant, 'egg.png');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ASSETS, file), dest);
    console.log(`${file} → ${path.relative(OUT, dest)}`);
    copied++;
    continue;
  }

  if (levelMatch) {
    const [, species, variant, level] = levelMatch;
    const dest = path.join(OUT, species, variant, `level-${level}.png`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ASSETS, file), dest);
    console.log(`${file} → ${path.relative(OUT, dest)}`);
    copied++;
  }
}

console.log(`\nCopied ${copied} pet images.`);

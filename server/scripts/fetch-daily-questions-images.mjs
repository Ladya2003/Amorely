#!/usr/bin/env node
/**
 * Скачивает JPG-ассеты для вопросов дня (800×600) в server/assets/daily-questions/.
 * После push в main GitHub Action загрузит их на Cloudinary.
 *
 * Usage: node scripts/fetch-daily-questions-images.mjs [--only key1,key2] [--force]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../assets/daily-questions');

const unsplash = (id) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=600&fit=crop&q=80&auto=format`;
const picsum = (key) => `https://picsum.photos/seed/daily-q-${key}/800/600`;

/** Основной URL + запасной (picsum), если Unsplash недоступен. */
const IMAGE_SOURCES = {
  restaurant_candle: [unsplash('1517248135467-4c7edcad34c4')],
  picnic_park: [unsplash('1742358613913-71ffdfb07512')],
  camping_tent: [unsplash('1478132641456-7593edb0661c'), picsum('camping_tent')],
  roadtrip_car: [unsplash('1503376780353-7c9216cc280a'), picsum('roadtrip_car')],
  forest_walk: [unsplash('1441974231531-c6227db76b6e')],
  lake_calm: [unsplash('1470071459604-3b5ec3a7fe05')],
  gym_couple: [unsplash('1534438327276-14e5300c3a48')],
  yoga_calm: [unsplash('1544367567-0f2fcb009e0b')],
  cinema_date: [unsplash('1478720568477-152d9b013e8a'), picsum('cinema_date')],
  couch_movie: [unsplash('1574269909862-7a1ba736647b'), picsum('couch_movie')],
  train_travel: [unsplash('1469474968028-56623f04e42e'), picsum('train_travel')],
  airplane_window: [unsplash('1436491865332-7a61a109cc05')],
  puppy_cuddle: [unsplash('1587300003388-59208cc962cb')],
  cat_lap: [unsplash('1518791841217-8f162f1e1131')],
  boho_decor: [unsplash('1616486338812-3dadae4b4ace')],
  minimalist_home: [unsplash('1493809842364-78817add7ffb')],
  coffee_morning: [unsplash('1509042239860-f550ce710b93')],
  breakfast_bed: [unsplash('1551218808-94e220e084d2')],
  rainy_window: [unsplash('1527482797697-5995d0860f66'), picsum('rainy_window')],
  snow_couple: [unsplash('1516572330211-75d19e21bdb0'), picsum('snow_couple')],
  sunset_beach: [unsplash('1507525428034-b723cf961d3e')],
  party_friends: [unsplash('1511795409834-ef04bbd61622')],
  wine_evening: [unsplash('1553361374-e4076592d088'), picsum('wine_evening')],
  polaroid_wall: [unsplash('1516035069371-29a1b244cc32')],
  city_night: [unsplash('1477959857967-bab9666b8032'), picsum('city_night')],
  art_studio: [unsplash('1513364777864-99bb31245eb9'), picsum('art_studio')],
  museum_art: [unsplash('1558618666-fcd25c85cd64')],
  farmers_market: [unsplash('1550583729-b269d632ea2f'), picsum('farmers_market')],
  stargazing: [unsplash('1444703695348-9b2db2a0436e'), picsum('stargazing')],
  vintage_room: [unsplash('1586023492125-27b2c045efd7')],
  flowers_bouquet: [unsplash('1464347756403-75d149388119'), picsum('flowers_bouquet')],
  handwritten_note: [unsplash('1516975080664-ed672fcfd3f0'), picsum('handwritten_note')],
  dance_floor: [unsplash('1470225620780-dba8ba79235e'), picsum('dance_floor')],
  wedding_dance: [unsplash('1519741497674-611481863552'), picsum('wedding_dance')],
};

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const force = args.includes('--force');
const onlyFilter = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(',')) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryDownload(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

async function downloadOne(key, urls) {
  const outPath = path.join(OUT_DIR, `${key}.jpg`);
  if (fs.existsSync(outPath) && !force) {
    console.log(`  skip (exists): ${key}`);
    return true;
  }

  for (const url of urls) {
    console.log(`  downloading: ${key}`);
    const buf = await tryDownload(url);
    if (buf && buf.length > 1000) {
      fs.writeFileSync(outPath, buf);
      return true;
    }
  }

  console.error(`  ✗ ${key}: all sources failed`);
  return false;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = Object.entries(IMAGE_SOURCES).filter(([key]) => !onlyFilter || onlyFilter.has(key));
  console.log(`Fetching ${entries.length} daily question images → ${OUT_DIR}\n`);

  let failed = 0;
  for (const [key, urls] of entries) {
    const ok = await downloadOne(key, urls);
    if (!ok) failed += 1;
    await sleep(200);
  }

  console.log(`\nDone. Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

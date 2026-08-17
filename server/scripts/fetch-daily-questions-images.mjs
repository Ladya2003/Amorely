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
const pexels = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;

/** Основной URL + тематический запасной. Picsum не используем — он отдаёт случайные фото. */
const IMAGE_SOURCES = {
  restaurant_candle: [unsplash('1517248135467-4c7edcad34c4')],
  picnic_park: [unsplash('1742358613913-71ffdfb07512')],
  camping_tent: [unsplash('1478132641456-7593edb0661c'), unsplash('1504280390367-361c6d9f38f4'), pexels(1687845)],
  roadtrip_car: [unsplash('1503376780353-7c9216cc280a'), pexels(21014)],
  forest_walk: [unsplash('1441974231531-c6227db76b6e')],
  lake_calm: [unsplash('1470071459604-3b5ec3a7fe05')],
  gym_couple: [unsplash('1534438327276-14e5300c3a48')],
  yoga_calm: [unsplash('1544367567-0f2fcb009e0b')],
  cinema_date: [unsplash('1489599849927-2ee91cede3ba'), unsplash('1517604931442-7e0c8ed2963c'), pexels(799443)],
  couch_movie: [unsplash('1522869635100-9f4c5e86aa37'), unsplash('1574375929048-2503b9041a99'), pexels(4009402)],
  train_travel: [pexels(2790396), unsplash('1474483546061-e4be158890e1')],
  airplane_window: [unsplash('1436491865332-7a61a109cc05')],
  puppy_cuddle: [unsplash('1587300003388-59208cc962cb')],
  cat_lap: [unsplash('1518791841217-8f162f1e1131')],
  boho_decor: [unsplash('1616486338812-3dadae4b4ace')],
  minimalist_home: [unsplash('1493809842364-78817add7ffb')],
  coffee_morning: [unsplash('1509042239860-f550ce710b93')],
  breakfast_bed: [unsplash('1641924676578-ed2792eb24de'), unsplash('1495474472287-4d71bcdd2085'), pexels(376464)],
  rainy_window: [unsplash('1515694346937-94d7e231eaba'), unsplash('1534274988757-a28bf1a57c17'), pexels(110874)],
  snow_couple: [unsplash('1483668101446-3d7584794345'), unsplash('1457269449837-42246884becf'), pexels(688660)],
  sunset_beach: [unsplash('1507525428034-b723cf961d3e')],
  party_friends: [unsplash('1511795409834-ef04bbd61622')],
  wine_evening: [unsplash('1510812431401-41d2bd2722f3'), unsplash('1506377247377-2a5b3b417ebb'), pexels(1407846)],
  polaroid_wall: [pexels(3792581), pexels(3225528), unsplash('1506802145846-5f9353710797')],
  city_night: [unsplash('1514565131-969bac785010'), unsplash('1519501025264-65ba15a82390'), pexels(315191)],
  art_studio: [pexels(102127), unsplash('1460661419201-fd4cecdf3690'), unsplash('1452860606245-08befc0ff44b')],
  museum_art: [unsplash('1564399579883-451a5d44ec08'), unsplash('1572945402110-739787abd606'), pexels(3004909)],
  farmers_market: [unsplash('1488459716781-31db52582fe9'), unsplash('1542838132-92c53300491e'), pexels(264636)],
  stargazing: [unsplash('1419242902214-272b3f66ee7a'), unsplash('1462331940025-496dfbfc7564'), pexels(1624438)],
  vintage_room: [unsplash('1586023492125-27b2c045efd7')],
  flowers_bouquet: [unsplash('1487530813396-ad18fe0d2606'), unsplash('1490750967993-fd46131dd60f'), pexels(931177)],
  handwritten_note: [unsplash('1455390582262-044cdead277a'), unsplash('1456327102063-fb5054efe647'), pexels(261859)],
  dance_floor: [unsplash('1470225620780-dba8ba79235e'), unsplash('1516450360452-9312f5e86fc7'), pexels(1763075)],
  wedding_dance: [unsplash('1519741497674-611481863552')],
  balcony: [unsplash('1578683010236-d716f9a3f461'), unsplash('1520250497591-112f2f40a3f4'), pexels(258154)],
  cozy: [unsplash('1583847268964-b28dc8f51f92'), unsplash('1615873968403-89e068629265'), pexels(1643383)],
};

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const force = args.includes('--force');
const onlyFilter = onlyIdx >= 0 ? new Set(args[onlyIdx + 1].split(',')) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryDownload(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4000) return null;
  return buf;
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
    if (buf) {
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

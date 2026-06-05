/**
 * Загружает локации из Wikidata + фото из Wikimedia Commons.
 *
 * Использование:
 *   npm run fetch:geo-locations
 *
 * Опционально: CLOUDINARY_* в server/.env — загрузит фото на Cloudinary.
 * Без Cloudinary — выдаст прямые URL upload.wikimedia.org (для теста).
 */

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

interface SeedPlace {
  id: string;
  wikidataId: string;
  nameRu: string;
  continent: string;
  country: string;
  city: string;
}

/** Новые места для geoGameConfig.ts (QID проверены через Wikipedia) */
const SEED_PLACES: SeedPlace[] = [
  { id: 'usa-death-valley', wikidataId: 'Q242111', nameRu: 'Долина Смерти, США', continent: 'Северная Америка', country: 'США', city: 'Калифорния' },
  { id: 'usa-bryce-canyon', wikidataId: 'Q219562', nameRu: 'Каньон Брайс, США', continent: 'Северная Америка', country: 'США', city: 'Юта' },
  { id: 'canada-banff', wikidataId: 'Q41858', nameRu: 'Национальный парк Банф', continent: 'Северная Америка', country: 'Канада', city: 'Альберта' },
  { id: 'peru-rainbow-mountain', wikidataId: 'Q28025526', nameRu: 'Радужная гора Виникунка', continent: 'Южная Америка', country: 'Перу', city: 'Куско' },
  { id: 'spain-seville-cathedral', wikidataId: 'Q231606', nameRu: 'Севильский собор, Испания', continent: 'Европа', country: 'Испания', city: 'Севилья' },
  { id: 'spain-segovia-aqueduct', wikidataId: 'Q244947', nameRu: 'Акведук Сеговии, Испания', continent: 'Европа', country: 'Испания', city: 'Сеговия' },
  { id: 'portugal-jeronimos', wikidataId: 'Q272781', nameRu: 'Монастырь Жеронимуш, Лиссабон', continent: 'Европа', country: 'Португалия', city: 'Лиссабон' },
  { id: 'belgium-bruges', wikidataId: 'Q12994', nameRu: 'Брюгге, Бельгия', continent: 'Европа', country: 'Бельгия', city: 'Брюгге' },
  { id: 'latvia-riga', wikidataId: 'Q1773', nameRu: 'Рига, Латвия', continent: 'Европа', country: 'Латвия', city: 'Рига' },
  { id: 'scotland-old-man-storr', wikidataId: 'Q104578769', nameRu: 'Старый человек Сторр, Шотландия', continent: 'Европа', country: 'Великобритания', city: 'Остров Скай' },
  { id: 'china-potala-palace', wikidataId: 'Q71229', nameRu: 'Дворец Потала, Тибет', continent: 'Азия', country: 'Китай', city: 'Лхаса' },
  { id: 'china-lijiang', wikidataId: 'Q205914', nameRu: 'Старый город Лицзян', continent: 'Азия', country: 'Китай', city: 'Лицзян' },
  { id: 'cambodia-bayon', wikidataId: 'Q654024', nameRu: 'Храм Байон, Ангкор', continent: 'Азия', country: 'Камбоджа', city: 'Сиемреап' },
  { id: 'laos-luang-prabang', wikidataId: 'Q190165', nameRu: 'Луангпхабанг, Лаос', continent: 'Азия', country: 'Лаос', city: 'Луангпхабанг' },
  { id: 'jordan-wadi-rum', wikidataId: 'Q40729', nameRu: 'Вади-Рам, Иордания', continent: 'Азия', country: 'Иордания', city: 'Вади-Рам' },
  { id: 'morocco-majorelle', wikidataId: 'Q1395431', nameRu: 'Сад Мажорель, Марракеш', continent: 'Африка', country: 'Марокко', city: 'Марракеш' },
  { id: 'zimbabwe-great-zimbabwe', wikidataId: 'Q209217', nameRu: 'Великий Зимбабве', continent: 'Африка', country: 'Зимбабве', city: 'Масвинго' },
  { id: 'new-zealand-hobbiton', wikidataId: 'Q18924400', nameRu: 'Хоббитон, Новая Зеландия', continent: 'Океания', country: 'Новая Зеландия', city: 'Матамата' },
  { id: 'usa-hawaii-volcanoes', wikidataId: 'Q205952', nameRu: 'Вулканический парк Гавайи', continent: 'Океания', country: 'США', city: 'Гавайи' },
];

interface WikidataEntity {
  claims?: {
    P625?: Array<{
      mainsnak: {
        datavalue?: {
          value: { latitude: number; longitude: number };
        };
      };
    }>;
    P18?: Array<{
      mainsnak: {
        datavalue?: {
          value: string;
        };
      };
    }>;
  };
}

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'AmorelyGeoGame/1.0 (contact: support@amorely.app)';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, retries = 4): Promise<Response> => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.ok || response.status < 429) {
      return response;
    }
    if (attempt < retries) {
      await sleep(1500 * (attempt + 1));
    } else {
      return response;
    }
  }
  throw new Error(`Failed to fetch ${url}`);
};

const fetchWikidataEntities = async (
  wikidataIds: string[]
): Promise<Record<string, WikidataEntity>> => {
  const params = new URLSearchParams({
    action: 'wbgetentities',
    ids: wikidataIds.join('|'),
    props: 'claims',
    format: 'json',
    origin: '*',
  });

  const response = await fetchWithRetry(`${WIKIDATA_API}?${params}`);
  if (!response.ok) {
    throw new Error(`Wikidata API error ${response.status}`);
  }

  const data = (await response.json()) as {
    entities: Record<string, WikidataEntity>;
  };

  return data.entities;
};

const getCoordinates = (entity: WikidataEntity): { lat: number; lng: number } => {
  const coordClaim = entity.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
  if (!coordClaim) {
    throw new Error('Coordinates (P625) not found');
  }

  return {
    lat: Number(coordClaim.latitude.toFixed(4)),
    lng: Number(coordClaim.longitude.toFixed(4)),
  };
};

const getCommonsImageFilename = (entity: WikidataEntity): string => {
  const filename = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!filename) {
    throw new Error('Image (P18) not found on Wikidata');
  }
  return filename;
};

const getCommonsThumbUrl = async (filename: string, width = 1200): Promise<string> => {
  const params = new URLSearchParams({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: String(width),
    format: 'json',
    origin: '*',
  });

  const response = await fetchWithRetry(`${COMMONS_API}?${params}`, 5);
  if (!response.ok) {
    throw new Error(`Commons API error ${response.status}`);
  }

  const data = (await response.json()) as {
    query: { pages: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string }> }> };
  };

  const page = Object.values(data.query.pages)[0];
  const imageInfo = page?.imageinfo?.[0];
  const thumbUrl = imageInfo?.thumburl || imageInfo?.url;

  if (!thumbUrl) {
    throw new Error(`Thumb URL not found for ${filename}`);
  }

  return thumbUrl;
};

const hasCloudinary = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const uploadToCloudinary = async (filename: string, publicId: string): Promise<string> => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const thumbUrl = await getCommonsThumbUrl(filename);

  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const imageResponse = await fetch(thumbUrl, { headers: { 'User-Agent': USER_AGENT } });
      if (!imageResponse.ok) {
        throw new Error(`Image download error ${imageResponse.status}`);
      }

      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'geo-locations',
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
          },
          (error, uploadResult) => (error ? reject(error) : resolve(uploadResult!))
        );
        stream.end(buffer);
      });

      return result.secure_url;
    } catch (error) {
      lastError = error;
      await sleep(2500 * (attempt + 1));
    }
  }

  throw lastError;
};

interface GeoLocationOutput {
  id: string;
  name: string;
  imageUrl: string;
  lat: number;
  lng: number;
  continent: string;
  country: string;
  city: string;
  commonsFilename: string;
}

const formatLocationEntry = (location: GeoLocationOutput): string => {
  const imageUrl =
    location.imageUrl.includes("'") || location.imageUrl.includes('\\')
      ? JSON.stringify(location.imageUrl)
      : `'${location.imageUrl}'`;

  return `  {
    id: '${location.id}',
    name: '${location.name}',
    imageUrl: ${imageUrl},
    lat: ${location.lat},
    lng: ${location.lng},
    continent: '${location.continent}',
    country: '${location.country}',
    city: '${location.city}',
  },`;
};

const main = async () => {
  console.log(`Загрузка ${SEED_PLACES.length} локаций из Wikidata + Wikimedia Commons...\n`);

  const useCloudinary = hasCloudinary();
  if (useCloudinary) {
    console.log('Cloudinary: настроен — фото будут загружены на ваш аккаунт.\n');
  } else {
    console.log(
      'Cloudinary: не настроен — будут использованы прямые URL Wikimedia Commons.\n' +
        'Для продакшена добавьте CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET в server/.env\n'
    );
  }

  const results: GeoLocationOutput[] = [];
  const entities = await fetchWikidataEntities(SEED_PLACES.map((place) => place.wikidataId));

  for (const place of SEED_PLACES) {
    process.stdout.write(`  ${place.nameRu} (${place.wikidataId})... `);

    try {
      const entity = entities[place.wikidataId];
      if (!entity) {
        throw new Error(`Entity ${place.wikidataId} not found`);
      }

      const { lat, lng } = getCoordinates(entity);
      const commonsFilename = getCommonsImageFilename(entity);

      let imageUrl = await getCommonsThumbUrl(commonsFilename);
      if (useCloudinary) {
        imageUrl = await uploadToCloudinary(commonsFilename, place.id);
      }

      results.push({
        id: place.id,
        name: place.nameRu,
        imageUrl,
        lat,
        lng,
        continent: place.continent,
        country: place.country,
        city: place.city,
        commonsFilename,
      });

      console.log('OK');
    } catch (error) {
      console.log('ОШИБКА');
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : String(error);
      console.error(`    ${message}`);
    }

    await sleep(3500);
  }

  if (results.length === 0) {
    console.error('\nНе удалось загрузить ни одной локации.');
    process.exit(1);
  }

  console.log('\n--- Скопируйте в geoGameConfig.ts (массив GEO_LOCATIONS) ---\n');
  for (const location of results) {
    console.log(formatLocationEntry(location));
  }

  console.log('\n--- Атрибуция ---\n');
  console.log('  Фотографии: Wikimedia Commons (лицензии Creative Commons)');
  console.log('  (уже добавлено в правила игры — отдельный список по каждому фото не нужен)');

  console.log(`\nГотово: ${results.length} из ${SEED_PLACES.length} локаций.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

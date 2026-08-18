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

/** Новые места для geoGameConfig.ts (QID проверены: P625 + P18) */
const SEED_PLACES: SeedPlace[] = [
  { id: 'portugal-belem-tower', wikidataId: 'Q215003', nameRu: 'Башня Белен, Лиссабон', continent: 'Европа', country: 'Португалия', city: 'Лиссабон' },
  { id: 'spain-casa-mila', wikidataId: 'Q207870', nameRu: 'Каса-Мила, Барселона', continent: 'Европа', country: 'Испания', city: 'Барселона' },
  { id: 'spain-city-of-arts', wikidataId: 'Q239935', nameRu: 'Город искусств и наук, Валенсия', continent: 'Европа', country: 'Испания', city: 'Валенсия' },
  { id: 'spain-montserrat', wikidataId: 'Q771935', nameRu: 'Монсеррат, Испания', continent: 'Европа', country: 'Испания', city: 'Монсеррат' },
  { id: 'spain-teide', wikidataId: 'Q715124', nameRu: 'Вулкан Тейде, Тенерифе', continent: 'Европа', country: 'Испания', city: 'Тенерифе' },
  { id: 'france-sacre-coeur', wikidataId: 'Q28785', nameRu: 'Сакре-Кёр, Париж', continent: 'Европа', country: 'Франция', city: 'Париж' },
  { id: 'france-chenonceau', wikidataId: 'Q193215', nameRu: 'Замок Шенонсо', continent: 'Европа', country: 'Франция', city: 'Шенонсо' },
  { id: 'france-carcassonne', wikidataId: 'Q6582', nameRu: 'Каркасон, Франция', continent: 'Европа', country: 'Франция', city: 'Каркасон' },
  { id: 'france-dune-pilat', wikidataId: 'Q501726', nameRu: 'Дюна Пила, Франция', continent: 'Европа', country: 'Франция', city: 'Аркашон' },
  { id: 'france-annecy', wikidataId: 'Q50189', nameRu: 'Анси, Франция', continent: 'Европа', country: 'Франция', city: 'Анси' },
  { id: 'germany-reichstag', wikidataId: 'Q151897', nameRu: 'Рейхстаг, Берлин', continent: 'Европа', country: 'Германия', city: 'Берлин' },
  { id: 'germany-sanssouci', wikidataId: 'Q151330', nameRu: 'Сан-Суси, Потсдам', continent: 'Европа', country: 'Германия', city: 'Потсдам' },
  { id: 'germany-elbphilharmonie', wikidataId: 'Q673223', nameRu: 'Эльбская филармония, Гамбург', continent: 'Европа', country: 'Германия', city: 'Гамбург' },
  { id: 'netherlands-zaanse-schans', wikidataId: 'Q136661', nameRu: 'Зансе-Сханс, Нидерланды', continent: 'Европа', country: 'Нидерланды', city: 'Зандам' },
  { id: 'belgium-grand-place', wikidataId: 'Q215429', nameRu: 'Гран-Плас, Брюссель', continent: 'Европа', country: 'Бельгия', city: 'Брюссель' },
  { id: 'czech-orloj', wikidataId: 'Q729370', nameRu: 'Пражские куранты', continent: 'Европа', country: 'Чехия', city: 'Прага' },
  { id: 'czech-krumlov', wikidataId: 'Q188082', nameRu: 'Чески-Крумлов', continent: 'Европа', country: 'Чехия', city: 'Чески-Крумлов' },
  { id: 'poland-wieliczka', wikidataId: 'Q454019', nameRu: 'Величка, Польша', continent: 'Европа', country: 'Польша', city: 'Величка' },
  { id: 'romania-peles', wikidataId: 'Q917702', nameRu: 'Замок Пелеш, Румыния', continent: 'Европа', country: 'Румыния', city: 'Синая' },
  { id: 'italy-spanish-steps', wikidataId: 'Q848072', nameRu: 'Испанская лестница, Рим', continent: 'Европа', country: 'Италия', city: 'Рим' },
  { id: 'italy-rialto', wikidataId: 'Q52505', nameRu: 'Мост Риальто, Венеция', continent: 'Европа', country: 'Италия', city: 'Венеция' },
  { id: 'italy-tre-cime', wikidataId: 'Q1257207', nameRu: 'Тре-Чиме, Доломиты', continent: 'Европа', country: 'Италия', city: 'Доломиты' },
  { id: 'switzerland-chillon', wikidataId: 'Q372647', nameRu: 'Шильонский замок', continent: 'Европа', country: 'Швейцария', city: 'Монтрё' },
  { id: 'switzerland-chapel-bridge', wikidataId: 'Q25225', nameRu: 'Часовенный мост, Люцерн', continent: 'Европа', country: 'Швейцария', city: 'Люцерн' },
  { id: 'uk-london-eye', wikidataId: 'Q160659', nameRu: 'Лондонский глаз', continent: 'Европа', country: 'Великобритания', city: 'Лондон' },
  { id: 'iceland-jokulsarlon', wikidataId: 'Q511933', nameRu: 'Йёкюльсаурлоун, Исландия', continent: 'Европа', country: 'Исландия', city: 'Хёбн' },
  { id: 'norway-oslo-opera', wikidataId: 'Q43280', nameRu: 'Оперный театр Осло', continent: 'Европа', country: 'Норвегия', city: 'Осло' },
  { id: 'lithuania-trakai', wikidataId: 'Q1482013', nameRu: 'Тракайский замок', continent: 'Европа', country: 'Литва', city: 'Тракай' },
  { id: 'finland-suomenlinna', wikidataId: 'Q1292442', nameRu: 'Суоменлинна, Хельсинки', continent: 'Европа', country: 'Финляндия', city: 'Хельсинки' },
  { id: 'usa-zion', wikidataId: 'Q205325', nameRu: 'Национальный парк Зайон', continent: 'Северная Америка', country: 'США', city: 'Юта' },
  { id: 'usa-lincoln-memorial', wikidataId: 'Q213559', nameRu: 'Мемориал Линкольна', continent: 'Северная Америка', country: 'США', city: 'Вашингтон' },
  { id: 'usa-white-house', wikidataId: 'Q35525', nameRu: 'Белый дом, Вашингтон', continent: 'Северная Америка', country: 'США', city: 'Вашингтон' },
  { id: 'usa-alcatraz', wikidataId: 'Q131354', nameRu: 'Алькатрас', continent: 'Северная Америка', country: 'США', city: 'Сан-Франциско' },
  { id: 'usa-grand-prismatic', wikidataId: 'Q1422831', nameRu: 'Гранд-Призматик, Йеллоустон', continent: 'Северная Америка', country: 'США', city: 'Вайоминг' },
  { id: 'usa-crater-lake', wikidataId: 'Q239304', nameRu: 'Кратер-Лейк, США', continent: 'Северная Америка', country: 'США', city: 'Орегон' },
  { id: 'usa-brooklyn-bridge', wikidataId: 'Q125006', nameRu: 'Бруклинский мост', continent: 'Северная Америка', country: 'США', city: 'Нью-Йорк' },
  { id: 'usa-one-wtc', wikidataId: 'Q11245', nameRu: 'Башня Свободы, Нью-Йорк', continent: 'Северная Америка', country: 'США', city: 'Нью-Йорк' },
  { id: 'canada-hopewell-rocks', wikidataId: 'Q1627589', nameRu: 'Скалы Хоупвелл, Канада', continent: 'Северная Америка', country: 'Канада', city: 'Нью-Брансуик' },
  { id: 'argentina-teatro-colon', wikidataId: 'Q827401', nameRu: 'Театр Колон, Буэнос-Айрес', continent: 'Южная Америка', country: 'Аргентина', city: 'Буэнос-Айрес' },
  { id: 'argentina-ushuaia', wikidataId: 'Q44254', nameRu: 'Ушуая, Аргентина', continent: 'Южная Америка', country: 'Аргентина', city: 'Ушуая' },
  { id: 'brazil-fernando-noronha', wikidataId: 'Q2438090', nameRu: 'Фернанду-ди-Норонья', continent: 'Южная Америка', country: 'Бразилия', city: 'Пернамбуку' },
  { id: 'peru-nazca', wikidataId: 'Q2620036', nameRu: 'Линии Наски, Перу', continent: 'Южная Америка', country: 'Перу', city: 'Наска' },
  { id: 'egypt-sphinx', wikidataId: 'Q130958', nameRu: 'Сфинкс Гизы', continent: 'Африка', country: 'Египет', city: 'Каир' },
  { id: 'egypt-karnak', wikidataId: 'Q522862', nameRu: 'Карнакский храм, Египет', continent: 'Африка', country: 'Египет', city: 'Луксор' },
  { id: 'egypt-valley-kings', wikidataId: 'Q133423', nameRu: 'Долина царей, Египет', continent: 'Африка', country: 'Египет', city: 'Луксор' },
  { id: 'morocco-ait-benhaddou', wikidataId: 'Q309436', nameRu: 'Айт-Бен-Хадду, Марокко', continent: 'Африка', country: 'Марокко', city: 'Уарзазат' },
  { id: 'morocco-hassan-ii', wikidataId: 'Q41346', nameRu: 'Мечеть Хасана II, Касабланка', continent: 'Африка', country: 'Марокко', city: 'Касабланка' },
  { id: 'morocco-essaouira', wikidataId: 'Q216939', nameRu: 'Эссуэйра, Марокко', continent: 'Африка', country: 'Марокко', city: 'Эссуэйра' },
  { id: 'morocco-volubilis', wikidataId: 'Q391215', nameRu: 'Волюбилис, Марокко', continent: 'Африка', country: 'Марокко', city: 'Мекнес' },
  { id: 'tunisia-el-jem', wikidataId: 'Q2914326', nameRu: 'Амфитеатр Эль-Джема', continent: 'Африка', country: 'Тунис', city: 'Эль-Джем' },
  { id: 'tanzania-ngorongoro', wikidataId: 'Q3002224', nameRu: 'Нгоронгоро, Танзания', continent: 'Африка', country: 'Танзания', city: 'Нгоронгоро' },
  { id: 'tanzania-stone-town', wikidataId: 'Q844417', nameRu: 'Каменный город, Занзибар', continent: 'Африка', country: 'Танзания', city: 'Занзибар' },
  { id: 'japan-tokyo-skytree', wikidataId: 'Q57965', nameRu: 'Токийский Скайтри', continent: 'Азия', country: 'Япония', city: 'Токио' },
  { id: 'japan-arashiyama', wikidataId: 'Q23579173', nameRu: 'Бамбуковая роща Арасияма', continent: 'Азия', country: 'Япония', city: 'Киото' },
  { id: 'japan-shirakawa-go', wikidataId: 'Q1002193', nameRu: 'Сиракава-го, Япония', continent: 'Азия', country: 'Япония', city: 'Гифу' },
  { id: 'japan-kiyomizu', wikidataId: 'Q221716', nameRu: 'Храм Киёмидзу-дэра, Киото', continent: 'Азия', country: 'Япония', city: 'Киото' },
  { id: 'korea-seongsan', wikidataId: 'Q122225', nameRu: 'Сонсан Ильчульбон, Чеджу', continent: 'Азия', country: 'Южная Корея', city: 'Чеджу' },
  { id: 'china-huangshan', wikidataId: 'Q180470', nameRu: 'Хуаншань, Китай', continent: 'Азия', country: 'Китай', city: 'Хуаншань' },
  { id: 'china-jiuzhaigou', wikidataId: 'Q4111', nameRu: 'Цзючжайгоу, Китай', continent: 'Азия', country: 'Китай', city: 'Сычуань' },
  { id: 'china-li-river', wikidataId: 'Q334225', nameRu: 'Река Ли, Гуйлинь', continent: 'Азия', country: 'Китай', city: 'Гуйлинь' },
  { id: 'uae-burj-al-arab', wikidataId: 'Q62939', nameRu: 'Бурдж-эль-Араб, Дубай', continent: 'Азия', country: 'ОАЭ', city: 'Дубай' },
  { id: 'india-hawa-mahal', wikidataId: 'Q836531', nameRu: 'Хава-Махал, Джайпур', continent: 'Азия', country: 'Индия', city: 'Джайпур' },
  { id: 'india-meenakshi', wikidataId: 'Q1424358', nameRu: 'Храм Минакши, Мадурай', continent: 'Азия', country: 'Индия', city: 'Мадурай' },
  { id: 'india-qutb-minar', wikidataId: 'Q187635', nameRu: 'Кутб-Минар, Дели', continent: 'Азия', country: 'Индия', city: 'Дели' },
  { id: 'indonesia-prambanan', wikidataId: 'Q47721', nameRu: 'Прамбанан, Индонезия', continent: 'Азия', country: 'Индонезия', city: 'Джокьякарта' },
  { id: 'indonesia-uluwatu', wikidataId: 'Q1381933', nameRu: 'Храм Улувату, Бали', continent: 'Азия', country: 'Индонезия', city: 'Бали' },
  { id: 'indonesia-raja-ampat', wikidataId: 'Q26785', nameRu: 'Раджа-Ампат, Индонезия', continent: 'Азия', country: 'Индонезия', city: 'Раджа-Ампат' },
  { id: 'myanmar-shwedagon', wikidataId: 'Q464535', nameRu: 'Пагода Шведагон, Янгон', continent: 'Азия', country: 'Мьянма', city: 'Янгон' },
  { id: 'thailand-wat-pho', wikidataId: 'Q1059910', nameRu: 'Ват Пхо, Бангкок', continent: 'Азия', country: 'Таиланд', city: 'Бангкок' },
  { id: 'vietnam-hoi-an', wikidataId: 'Q36160', nameRu: 'Хойан, Вьетнам', continent: 'Азия', country: 'Вьетнам', city: 'Хойан' },
  { id: 'singapore-gardens-bay', wikidataId: 'Q630135', nameRu: 'Сады у залива, Сингапур', continent: 'Азия', country: 'Сингапур', city: 'Сингапур' },
  { id: 'uzbekistan-bukhara', wikidataId: 'Q5764', nameRu: 'Бухара, Узбекистан', continent: 'Азия', country: 'Узбекистан', city: 'Бухара' },
  { id: 'uzbekistan-khiva', wikidataId: 'Q486195', nameRu: 'Хива, Узбекистан', continent: 'Азия', country: 'Узбекистан', city: 'Хива' },
  { id: 'israel-masada', wikidataId: 'Q186312', nameRu: 'Масада, Израиль', continent: 'Азия', country: 'Израиль', city: 'Масада' },
  { id: 'new-zealand-moeraki', wikidataId: 'Q516651', nameRu: 'Валуны Моераки', continent: 'Океания', country: 'Новая Зеландия', city: 'Отаго' },
  { id: 'australia-whitehaven', wikidataId: 'Q2123432', nameRu: 'Пляж Уайтхейвен', continent: 'Океания', country: 'Австралия', city: 'Квинсленд' },
  { id: 'new-zealand-tekapo', wikidataId: 'Q1194022', nameRu: 'Озеро Текапо', continent: 'Океания', country: 'Новая Зеландия', city: 'Текапо' },
  { id: 'new-zealand-tongariro', wikidataId: 'Q202845', nameRu: 'Тонгариро, Новая Зеландия', continent: 'Океания', country: 'Новая Зеландия', city: 'Тонгариро' },
  { id: 'french-polynesia-moorea', wikidataId: 'Q673400', nameRu: 'Муреа, Французская Полинезия', continent: 'Океания', country: 'Франция', city: 'Муреа' },
  { id: 'new-zealand-fox-glacier', wikidataId: 'Q1147722', nameRu: 'Ледник Фокс, Новая Зеландия', continent: 'Океания', country: 'Новая Зеландия', city: 'Фокс-Глейшер' },
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
  const entities: Record<string, WikidataEntity> = {};

  for (let index = 0; index < wikidataIds.length; index += 40) {
    const chunk = wikidataIds.slice(index, index + 40);
    const params = new URLSearchParams({
      action: 'wbgetentities',
      ids: chunk.join('|'),
      props: 'claims',
      format: 'json',
      origin: '*',
    });

    const response = await fetchWithRetry(`${WIKIDATA_API}?${params}`);
    if (!response.ok) {
      throw new Error(`Wikidata API error ${response.status}`);
    }

    const data = (await response.json()) as {
      entities?: Record<string, WikidataEntity>;
    };

    Object.assign(entities, data.entities ?? {});
    await sleep(400);
  }

  return entities;
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

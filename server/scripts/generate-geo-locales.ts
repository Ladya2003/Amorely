/**
 * Translates geo labels (continents, countries, cities, locations) to app locales.
 * English source comes from generated/geoLocationsI18n.ts.
 *
 * Run: npx ts-node scripts/generate-geo-locales.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { GEO_LOCATIONS } from '../src/games/geoGameConfig';
import {
  GEO_CITY_I18N,
  GEO_CONTINENT_I18N,
  GEO_COUNTRY_I18N,
  GEO_LOCATION_I18N,
} from '../src/i18n/generated/geoLocationsI18n';
import { AppLocale, SUPPORTED_LOCALES } from '../src/i18n/locales';
import { translateText } from './googleTranslate';

const TARGET_LOCALES = SUPPORTED_LOCALES.filter((locale) => locale !== 'ru' && locale !== 'en') as AppLocale[];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const escapeTs = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const cachePath = path.join(__dirname, '.geo-i18n-cache.json');

type TranslationCache = Record<string, Partial<Record<AppLocale, string>>>;

const COUNTRY_OVERRIDES: Record<string, Partial<Record<AppLocale, string>>> = {
  Китай: { by: 'Кітай', uk: 'Китай', es: 'China', de: 'China', fr: 'Chine', pt: 'China' },
  Турция: { by: 'Турцыя', uk: 'Туреччина', es: 'Turquía', de: 'Türkei', fr: 'Turquie', pt: 'Turquia' },
};

const CONTINENT_OVERRIDES: Record<string, Partial<Record<AppLocale, string>>> = {
  Азия: { by: 'Азія', uk: 'Азія', es: 'Asia', de: 'Asien', fr: 'Asie', pt: 'Ásia' },
  Африка: { by: 'Афрыка', uk: 'Африка', es: 'África', de: 'Afrika', fr: 'Afrique', pt: 'África' },
  Европа: { by: 'Еўропа', uk: 'Європа', es: 'Europa', de: 'Europa', fr: 'Europe', pt: 'Europa' },
  Океания: { by: 'Акіянія', uk: 'Океанія', es: 'Oceanía', de: 'Ozeanien', fr: 'Océanie', pt: 'Oceania' },
  'Северная Америка': {
    by: 'Паўночная Амерыка',
    uk: 'Північна Америка',
    es: 'América del Norte',
    de: 'Nordamerika',
    fr: 'Amérique du Nord',
    pt: 'América do Norte',
  },
  'Южная Америка': {
    by: 'Паўднёвая Амерыка',
    uk: 'Південна Америка',
    es: 'América del Sur',
    de: 'Südamerika',
    fr: 'Amérique du Sud',
    pt: 'América do Sul',
  },
};

const loadCache = (): TranslationCache => {
  if (!fs.existsSync(cachePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as TranslationCache;
};

const saveCache = (cache: TranslationCache) => {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
};

const translateUnique = async (
  english: string,
  cache: TranslationCache
): Promise<Partial<Record<AppLocale, string>>> => {
  const cached = cache[english] ?? {};
  const result: Partial<Record<AppLocale, string>> = { ...cached };

  for (const locale of TARGET_LOCALES) {
    if (result[locale]) {
      continue;
    }
    const translated = await translateText(english, locale);
    result[locale] = translated;
    cache[english] = { ...cache[english], [locale]: translated };
    saveCache(cache);
    await sleep(150);
  }

  return result;
};

const formatStringLocales = (record: Partial<Record<AppLocale, string>>) => {
  const parts = TARGET_LOCALES.flatMap((locale) => {
    const value = record[locale];
    return value ? [`${locale}: '${escapeTs(value)}'`] : [];
  });
  return `{ ${parts.join(', ')} }`;
};

const formatLocationLocales = (record: Partial<Record<AppLocale, { name: string; continent: string; country: string; city: string }>>) => {
  const parts = TARGET_LOCALES.flatMap((locale) => {
    const value = record[locale];
    if (!value) {
      return [];
    }
    return [
      `${locale}: { name: '${escapeTs(value.name)}', continent: '${escapeTs(value.continent)}', country: '${escapeTs(value.country)}', city: '${escapeTs(value.city)}' }`,
    ];
  });
  return `{ ${parts.join(', ')} }`;
};

const main = async () => {
  const cache = loadCache();
  const continentLocales: Record<string, Partial<Record<AppLocale, string>>> = {};
  const countryLocales: Record<string, Partial<Record<AppLocale, string>>> = {};
  const cityLocales: Record<string, Partial<Record<AppLocale, string>>> = {};
  const locationLocales: Record<
    string,
    Partial<Record<AppLocale, { name: string; continent: string; country: string; city: string }>>
  > = {};

  const continentKeys = Object.keys(GEO_CONTINENT_I18N);
  console.log(`Translating ${continentKeys.length} continents...`);
  for (const ru of continentKeys) {
    const en = GEO_CONTINENT_I18N[ru]?.en ?? ru;
    continentLocales[ru] = { ...(await translateUnique(en, cache)), ...CONTINENT_OVERRIDES[ru] };
  }

  const countryKeys = Object.keys(GEO_COUNTRY_I18N);
  console.log(`Translating ${countryKeys.length} countries...`);
  for (const [index, ru] of countryKeys.entries()) {
    const en = GEO_COUNTRY_I18N[ru]?.en ?? ru;
    countryLocales[ru] = { ...(await translateUnique(en, cache)), ...COUNTRY_OVERRIDES[ru] };
    if ((index + 1) % 20 === 0 || index + 1 === countryKeys.length) {
      console.log(`  countries: ${index + 1}/${countryKeys.length}`);
    }
  }

  const cityKeys = Object.keys(GEO_CITY_I18N);
  console.log(`Translating ${cityKeys.length} cities...`);
  for (const [index, ru] of cityKeys.entries()) {
    const en = GEO_CITY_I18N[ru]?.en ?? ru;
    cityLocales[ru] = await translateUnique(en, cache);
    if ((index + 1) % 25 === 0 || index + 1 === cityKeys.length) {
      console.log(`  cities: ${index + 1}/${cityKeys.length}`);
    }
  }

  console.log(`Translating ${GEO_LOCATIONS.length} location names...`);
  for (const [index, location] of GEO_LOCATIONS.entries()) {
    const en = GEO_LOCATION_I18N[location.id]?.en;
    if (!en) {
      continue;
    }
    const nameLocales = await translateUnique(en.name, cache);
    const continentLocal = continentLocales[location.continent] ?? {};
    const countryLocal = countryLocales[location.country] ?? {};
    const cityLocal = cityLocales[location.city] ?? {};

    locationLocales[location.id] = {};
    for (const locale of TARGET_LOCALES) {
      const name = nameLocales[locale];
      if (!name) {
        continue;
      }
      locationLocales[location.id]![locale] = {
        name,
        continent: continentLocal[locale] ?? en.continent,
        country: countryLocal[locale] ?? en.country,
        city: cityLocal[locale] ?? en.city,
      };
    }

    if ((index + 1) % 25 === 0 || index + 1 === GEO_LOCATIONS.length) {
      console.log(`  locations: ${index + 1}/${GEO_LOCATIONS.length}`);
    }
  }

  const continentLines = Object.entries(continentLocales)
    .map(([ru, locales]) => `  '${escapeTs(ru)}': ${formatStringLocales(locales)},`)
    .join('\n');
  const countryLines = Object.entries(countryLocales)
    .map(([ru, locales]) => `  '${escapeTs(ru)}': ${formatStringLocales(locales)},`)
    .join('\n');
  const cityLines = Object.entries(cityLocales)
    .map(([ru, locales]) => `  '${escapeTs(ru)}': ${formatStringLocales(locales)},`)
    .join('\n');
  const locationLines = Object.entries(locationLocales)
    .map(([id, locales]) => `  '${escapeTs(id)}': ${formatLocationLocales(locales)},`)
    .join('\n');

  const out = `/** Auto-generated by scripts/generate-geo-locales.ts — do not edit manually. */
import type { AppLocale } from './locales';
import type { GeoLocationLocaleEntry } from './generated/geoLocationsI18n';

export const GEO_CONTINENT_LOCALE_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
${continentLines}
};

export const GEO_COUNTRY_LOCALE_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
${countryLines}
};

export const GEO_CITY_LOCALE_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
${cityLines}
};

export const GEO_LOCATION_LOCALE_I18N: Record<string, Partial<Record<AppLocale, GeoLocationLocaleEntry>>> = {
${locationLines}
};
`;

  const outPath = path.join(__dirname, '../src/i18n/geoLocationsLocales.ts');
  fs.writeFileSync(outPath, out);
  console.log(`Wrote ${outPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

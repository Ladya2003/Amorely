/**
 * Generates quiz category, question, and answer translations for all app locales.
 * Uses existing EN data as source; translates to es/de/fr/pt/uk via Google Translate.
 *
 * Run: npx ts-node scripts/generate-quiz-i18n.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { QUIZ_CATEGORIES, QUIZ_QUESTIONS } from '../src/games/quizGameConfig';
import { QUIZ_ANSWER_EN } from '../src/i18n/generated/quizAnswersEn';
import { QUIZ_ANSWER_I18N } from '../src/i18n/generated/quizAnswersI18n';
import { QUIZ_QUESTION_EN } from '../src/i18n/generated/quizQuestionsEn';
import { QUIZ_QUESTION_I18N } from '../src/i18n/generated/quizQuestionsI18n';
import { AppLocale, SUPPORTED_LOCALES } from '../src/i18n/locales';
import { translateText } from './googleTranslate';

const TARGET_LOCALES = SUPPORTED_LOCALES.filter((locale) => locale !== 'ru' && locale !== 'en') as AppLocale[];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const CATEGORY_I18N: Record<string, Record<AppLocale, string>> = {
  love: {
    ru: 'Любовь',
    en: 'Love',
    es: 'Amor',
    de: 'Liebe',
    fr: 'Amour',
    pt: 'Amor',
    uk: 'Любов',
    by: 'Каханне',
  },
  cinema: {
    ru: 'Кино',
    en: 'Movies',
    es: 'Cine',
    de: 'Kino',
    fr: 'Cinéma',
    pt: 'Cinema',
    uk: 'Кіно',
    by: 'Кіно',
  },
  travel: {
    ru: 'Путешествия',
    en: 'Travel',
    es: 'Viajes',
    de: 'Reisen',
    fr: 'Voyages',
    pt: 'Viagens',
    uk: 'Подорожі',
    by: 'Падарожжы',
  },
  general: {
    ru: 'Общее',
    en: 'General',
    es: 'General',
    de: 'Allgemein',
    fr: 'Général',
    pt: 'Geral',
    uk: 'Загальне',
    by: 'Агульнае',
  },
  music: {
    ru: 'Музыка',
    en: 'Music',
    es: 'Música',
    de: 'Musik',
    fr: 'Musique',
    pt: 'Música',
    uk: 'Музика',
    by: 'Музыка',
  },
  food: {
    ru: 'Еда и кухня',
    en: 'Food & Cooking',
    es: 'Comida y cocina',
    de: 'Essen & Kochen',
    fr: 'Cuisine',
    pt: 'Comida e culinária',
    uk: 'Їжа та кухня',
    by: 'Ежа і кухня',
  },
  nature: {
    ru: 'Природа и животные',
    en: 'Nature & Animals',
    es: 'Naturaleza y animales',
    de: 'Natur & Tiere',
    fr: 'Nature et animaux',
    pt: 'Natureza e animais',
    uk: 'Природа та тварини',
    by: 'Прырода і жывёлы',
  },
  holidays: {
    ru: 'Праздники и традиции',
    en: 'Holidays & Traditions',
    es: 'Fiestas y tradiciones',
    de: 'Feiertage & Traditionen',
    fr: 'Fêtes et traditions',
    pt: 'Festas e tradições',
    uk: 'Свята та традиції',
    by: 'Святы і традыцыі',
  },
  loveLanguages: {
    ru: 'Языки любви',
    en: 'Love Languages',
    es: 'Lenguajes del amor',
    de: 'Liebessprachen',
    fr: "Langages de l'amour",
    pt: 'Linguagens do amor',
    uk: 'Мови кохання',
    by: 'Мовы кахання',
  },
  tech: {
    ru: 'Технологии и интернет',
    en: 'Technology & Internet',
    es: 'Tecnología e internet',
    de: 'Technologie & Internet',
    fr: 'Technologie et internet',
    pt: 'Tecnologia e internet',
    uk: 'Технології та інтернет',
    by: 'Тэхналогіі і інтэрнэт',
  },
  sport: {
    ru: 'Спорт',
    en: 'Sports',
    es: 'Deportes',
    de: 'Sport',
    fr: 'Sports',
    pt: 'Esportes',
    uk: 'Спорт',
    by: 'Спорт',
  },
  art: {
    ru: 'Искусство и литература',
    en: 'Art & Literature',
    es: 'Arte y literatura',
    de: 'Kunst & Literatur',
    fr: 'Art et littérature',
    pt: 'Arte e literatura',
    uk: 'Мистецтво та література',
    by: 'Мастацтва і літаратура',
  },
  home: {
    ru: 'Дом и быт',
    en: 'Home & Daily Life',
    es: 'Hogar y vida cotidiana',
    de: 'Zuhause & Alltag',
    fr: 'Maison et quotidien',
    pt: 'Casa e vida diária',
    uk: 'Дім та побут',
    by: 'Дом і побыт',
  },
};

const escapeTs = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const cachePath = path.join(__dirname, '.quiz-i18n-cache.json');

type TranslationCache = Record<string, Partial<Record<AppLocale, string>>>;

const loadCache = (): TranslationCache => {
  if (!fs.existsSync(cachePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as TranslationCache;
};

const saveCache = (cache: TranslationCache) => {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
};

const seedCacheFromGenerated = (cache: TranslationCache) => {
  for (const [id, locales] of Object.entries(QUIZ_QUESTION_I18N)) {
    const key = `questions:${id}`;
    cache[key] = { ...locales, ...cache[key] };
  }
  for (const [id, locales] of Object.entries(QUIZ_ANSWER_I18N)) {
    const key = `answers:${id}`;
    cache[key] = { ...locales, ...cache[key] };
  }
};

const translateBatch = async (
  entries: Array<{ id: string; en: string }>,
  label: string,
  cache: TranslationCache
): Promise<Record<string, Partial<Record<AppLocale, string>>>> => {
  const result: Record<string, Partial<Record<AppLocale, string>>> = {};

  for (const [index, entry] of entries.entries()) {
    const cacheKey = `${label}:${entry.id}`;
    result[entry.id] = { en: entry.en, ...(cache[cacheKey] ?? {}) };

    for (const locale of TARGET_LOCALES) {
      if (result[entry.id]![locale]) {
        continue;
      }

      const translated = await translateText(entry.en, locale);
      result[entry.id]![locale] = translated;
      cache[cacheKey] = { ...cache[cacheKey], [locale]: translated };
      saveCache(cache);
      await sleep(150);
    }

    if ((index + 1) % 25 === 0 || index + 1 === entries.length) {
      console.log(`  ${label}: ${index + 1}/${entries.length}`);
    }
  }

  return result;
};

const formatLocaleRecord = (record: Partial<Record<AppLocale, string>>) => {
  const parts = SUPPORTED_LOCALES.flatMap((locale) => {
    const value = record[locale];
    return value ? [`${locale}: '${escapeTs(value)}'`] : [];
  });
  return `{ ${parts.join(', ')} }`;
};

const writeCategoryFile = () => {
  const lines = QUIZ_CATEGORIES.map((category) => {
    const localized = CATEGORY_I18N[category.id];
    if (!localized) {
      throw new Error(`Missing category translations for ${category.id}`);
    }
    return `  '${category.id}': ${formatLocaleRecord(localized)},`;
  });

  const out = `/** Auto-generated by scripts/generate-quiz-i18n.ts — do not edit manually. */
import type { AppLocale } from '../locales';

export const QUIZ_CATEGORY_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
${lines.join('\n')}
};
`;

  fs.writeFileSync(path.join(outDir, 'quizI18nData.ts'), out);
};

const writeQuestionFile = (questions: Record<string, Partial<Record<AppLocale, string>>>) => {
  const lines = QUIZ_QUESTIONS.map((question) => {
    const localized = {
      ru: question.text,
      en: QUIZ_QUESTION_EN[question.id] ?? question.text,
      ...questions[question.id],
    };
    return `  '${question.id}': ${formatLocaleRecord(localized)},`;
  });

  const out = `/** Auto-generated by scripts/generate-quiz-i18n.ts — do not edit manually. */
import type { AppLocale } from '../locales';

export const QUIZ_QUESTION_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
${lines.join('\n')}
};
`;

  fs.writeFileSync(path.join(outDir, 'quizQuestionsI18n.ts'), out);
};

const writeAnswerFile = (answers: Record<string, Partial<Record<AppLocale, string>>>) => {
  const lines = QUIZ_QUESTIONS.map((question) => {
    const localized = {
      en: QUIZ_ANSWER_EN[question.id] ?? question.answers[0],
      ...answers[question.id],
    };
    return `  '${question.id}': ${formatLocaleRecord(localized)},`;
  });

  const out = `/** Auto-generated by scripts/generate-quiz-i18n.ts — do not edit manually. */
import type { AppLocale } from '../locales';

export const QUIZ_ANSWER_I18N: Record<string, Partial<Record<AppLocale, string>>> = {
${lines.join('\n')}
};
`;

  fs.writeFileSync(path.join(outDir, 'quizAnswersI18n.ts'), out);
};

const outDir = path.join(__dirname, '../src/i18n/generated');

const main = async () => {
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Writing category translations...');
  writeCategoryFile();

  const questionEntries = QUIZ_QUESTIONS.map((question) => ({
    id: question.id,
    en: QUIZ_QUESTION_EN[question.id] ?? question.text,
  }));

  const answerEntries = QUIZ_QUESTIONS.map((question) => ({
    id: question.id,
    en: QUIZ_ANSWER_EN[question.id] ?? question.answers[0],
  }));

  const cache = loadCache();
  seedCacheFromGenerated(cache);

  console.log(`Translating ${questionEntries.length} questions to ${TARGET_LOCALES.join(', ')}...`);
  const translatedQuestions = await translateBatch(questionEntries, 'questions', cache);

  console.log(`Translating ${answerEntries.length} answers to ${TARGET_LOCALES.join(', ')}...`);
  const translatedAnswers = await translateBatch(answerEntries, 'answers', cache);

  writeQuestionFile(translatedQuestions);
  writeAnswerFile(translatedAnswers);

  console.log('Done.');
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

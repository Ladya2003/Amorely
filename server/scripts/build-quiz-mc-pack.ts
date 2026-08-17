/**
 * Translates fetched pack questions to Russian and writes runtime + i18n sources.
 * Run: npx ts-node scripts/build-quiz-mc-pack.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { translateText } from './googleTranslate';

type RawQuestion = {
  categoryId: string;
  text: string;
  correct: string;
  incorrect: string[];
};

type OptionId = 'a' | 'b' | 'c' | 'd';

type BuiltQuestion = {
  id: string;
  categoryId: string;
  text: string;
  textEn: string;
  correctId: 'a';
  options: Array<{ id: OptionId; text: string; textEn: string }>;
};

const OPTION_IDS: OptionId[] = ['a', 'b', 'c', 'd'];
const PER_CATEGORY = 20;
const KEEP_ENGLISH = new Set([
  'Queen',
  'Level 42',
  'Deep Purple',
  'Feeder',
  'Sade',
  'The Rolling Stones',
  'King Crimson',
  'Mogwai',
]);
const OPTION_RU_OVERRIDES: Record<string, string> = {
  'True Grit': 'Железная хватка',
  'The Hateful Eight': 'Омерзительная восьмёрка',
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeTs = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const cachePath = path.join(__dirname, '.quiz-mc-pack-cache.json');
const rawPath = path.join(__dirname, 'quiz-mc-pack-raw.json');

const loadCache = (): Record<string, string> => {
  if (!fs.existsSync(cachePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Record<string, string>;
};

const saveCache = (cache: Record<string, string>) => {
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
};

const translateToRu = async (text: string, cache: Record<string, string>) => {
  const key = text.trim();
  if (cache[key]) {
    return cache[key];
  }
  const translated = await translateText(key, 'ru');
  cache[key] = translated;
  saveCache(cache);
  await sleep(160);
  return translated;
};

const pickQuestions = (rows: RawQuestion[]) => {
  const preferred = rows.filter((row) => !/which of these quotes/i.test(row.text));
  const pool = preferred.length >= PER_CATEGORY ? preferred : rows;
  return pool.slice(0, PER_CATEGORY);
};

const formatQuestion = (question: BuiltQuestion) => {
  const options = question.options
    .map(
      (option) =>
        `      { id: '${option.id}', text: '${escapeTs(option.text)}', textEn: '${escapeTs(option.textEn)}' }`
    )
    .join(',\n');

  return `  {
    id: '${question.id}',
    categoryId: '${question.categoryId}',
    text: '${escapeTs(question.text)}',
    textEn: '${escapeTs(question.textEn)}',
    correctId: 'a',
    options: [
${options},
    ],
  }`;
};

const main = async () => {
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8')) as Record<string, RawQuestion[]>;
  const cache = loadCache();
  const built: BuiltQuestion[] = [];

  for (const [categoryId, rows] of Object.entries(raw)) {
    const selected = pickQuestions(rows);
    console.log(`${categoryId}: translating ${selected.length} questions...`);

    for (const [index, row] of selected.entries()) {
      const optionEn = [row.correct, ...row.incorrect];
      const text = await translateToRu(row.text, cache);
      const optionRu: string[] = [];
      for (const option of optionEn) {
        if (KEEP_ENGLISH.has(option) || /^\d+$/.test(option)) {
          optionRu.push(option);
          continue;
        }
        if (OPTION_RU_OVERRIDES[option]) {
          optionRu.push(OPTION_RU_OVERRIDES[option]);
          continue;
        }
        optionRu.push(await translateToRu(option, cache));
      }

      built.push({
        id: `${categoryId}-${index + 1}`,
        categoryId,
        text,
        textEn: row.text,
        correctId: 'a',
        options: OPTION_IDS.map((id, optionIndex) => ({
          id,
          text: optionRu[optionIndex],
          textEn: optionEn[optionIndex],
        })),
      });
    }
  }

  const out = `/** Auto-generated from The Trivia API / OpenTDB. Do not edit by hand. */
import type { QuizQuestionSource } from './quizGameTypes';

export const QUIZ_QUESTIONS_PACK_SOURCE: QuizQuestionSource[] = [
${built.map(formatQuestion).join(',\n')},
];
`;

  const outPath = path.join(__dirname, '../src/games/quizGameContentPack.ts');
  fs.writeFileSync(outPath, out);
  console.log(`Wrote ${built.length} pack questions to ${outPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

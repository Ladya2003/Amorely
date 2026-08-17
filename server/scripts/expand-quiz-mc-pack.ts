/**
 * Fetches extra MC questions and writes quizGameContentPackExpand.ts.
 * Run: npx ts-node scripts/expand-quiz-mc-pack.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { QUIZ_QUESTIONS_PACK_SOURCE } from '../src/games/quizGameContentPack';
import { translateText } from './googleTranslate';

type PackQuestion = {
  categoryId: string;
  text: string;
  correct: string;
  incorrect: string[];
};

type OptionId = 'a' | 'b' | 'c' | 'd';

const OPTION_IDS: OptionId[] = ['a', 'b', 'c', 'd'];
const TARGET_PER_CATEGORY = 20;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const OPEN_TDB: Record<string, number[]> = {
  cinema: [11, 32],
  travel: [22],
  sport: [21],
  music: [12],
  nature: [17],
  art: [10, 25],
  general: [9],
  history: [23],
  tech: [30, 19],
  mythology: [20],
  animals: [27],
  series: [14],
  videoGames: [15],
};

const TRIVIA_EXTRA: Record<string, string> = {
  food: 'food_and_drink',
  cinema: 'film_and_tv',
  travel: 'geography',
  sport: 'sport_and_leisure',
  music: 'music',
  nature: 'science',
  art: 'arts_and_literature',
  general: 'general_knowledge',
  history: 'history',
};

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

const TITLE_CATEGORIES = new Set(['series', 'videoGames', 'cinema', 'music']);

const decodeHtml = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&eacute;/g, 'é')
    .replace(/&ouml;/g, 'ö')
    .replace(/&uuml;/g, 'ü')
    .replace(/&auml;/g, 'ä')
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&pi;/g, 'π')
    .replace(/&deg;/g, '°')
    .replace(/&ntilde;/g, 'ñ');

const isUsable = (question: string, options: string[]) => {
  if (question.length > 140 || options.some((option) => option.length > 72)) {
    return false;
  }
  if (options.some((option) => /https?:\/\//i.test(option))) {
    return false;
  }
  return new Set(options.map((option) => option.trim().toLowerCase())).size === 4;
};

const shouldKeepEnglish = (option: string, categoryId: string) => {
  if (KEEP_ENGLISH.has(option) || /^\d+$/.test(option)) {
    return true;
  }
  if (!TITLE_CATEGORIES.has(categoryId)) {
    return false;
  }
  const words = option.trim().split(/\s+/);
  return words.length <= 6 && /^[A-Z0-9]/.test(option) && !/[?]/.test(option);
};

const escapeTs = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const cachePath = path.join(__dirname, '.quiz-mc-pack-cache.json');

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

const requestOpenTdbToken = async () => {
  const response = await fetch('https://opentdb.com/api_token.php?command=request');
  const payload = (await response.json()) as { token?: string };
  if (!payload.token) {
    throw new Error('OpenTDB token request failed');
  }
  return payload.token;
};

const fetchOpenTdb = async (
  categoryId: string,
  categoryCode: number,
  token: string,
  seen: Set<string>
): Promise<PackQuestion[]> => {
  const url = `https://opentdb.com/api.php?amount=50&category=${categoryCode}&type=multiple&token=${token}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OpenTDB ${categoryCode}: HTTP ${response.status}`);
  }
  const payload = (await response.json()) as {
    response_code?: number;
    results?: Array<{
      question: string;
      correct_answer: string;
      incorrect_answers: string[];
    }>;
  };
  if (payload.response_code && payload.response_code !== 0) {
    console.log(`  OpenTDB ${categoryCode} code ${payload.response_code}`);
    return [];
  }

  const collected: PackQuestion[] = [];
  for (const row of payload.results ?? []) {
    const text = decodeHtml(row.question).trim();
    const correct = decodeHtml(row.correct_answer).trim();
    const incorrect = (row.incorrect_answers || []).map((item) => decodeHtml(item).trim()).slice(0, 3);
    if (incorrect.length !== 3 || !isUsable(text, [correct, ...incorrect])) {
      continue;
    }
    if (/which of these quotes/i.test(text)) {
      continue;
    }
    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    collected.push({ categoryId, text, correct, incorrect });
  }
  return collected;
};

const fetchTrivia = async (categoryId: string, apiCategory: string, seen: Set<string>): Promise<PackQuestion[]> => {
  const collected: PackQuestion[] = [];
  for (let page = 0; page < 2; page += 1) {
    const url = `https://the-trivia-api.com/v2/questions?limit=50&categories=${apiCategory}&types=text_choice`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Trivia API ${apiCategory}: HTTP ${response.status}`);
    }
    const rows = (await response.json()) as Array<{
      question: { text: string };
      correctAnswer: string;
      incorrectAnswers: string[];
      isNiche?: boolean;
    }>;
    for (const row of rows) {
      if (row.isNiche) {
        continue;
      }
      const text = row.question.text.trim();
      const correct = row.correctAnswer.trim();
      const incorrect = (row.incorrectAnswers || []).map((item) => item.trim()).slice(0, 3);
      if (incorrect.length !== 3 || !isUsable(text, [correct, ...incorrect])) {
        continue;
      }
      if (/which of these quotes/i.test(text)) {
        continue;
      }
      const key = text.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      collected.push({ categoryId, text, correct, incorrect });
    }
    await sleep(400);
  }
  return collected;
};

const formatQuestion = (
  categoryId: string,
  index: number,
  text: string,
  textEn: string,
  optionRu: string[],
  optionEn: string[]
) => {
  const options = OPTION_IDS.map(
    (id, optionIndex) =>
      `      { id: '${id}', text: '${escapeTs(optionRu[optionIndex])}', textEn: '${escapeTs(optionEn[optionIndex])}' }`
  ).join(',\n');

  return `  {
    id: '${categoryId}-${index}',
    categoryId: '${categoryId}',
    text: '${escapeTs(text)}',
    textEn: '${escapeTs(textEn)}',
    correctId: 'a',
    options: [
${options},
    ],
  }`;
};

const main = async () => {
  const seen = new Set(QUIZ_QUESTIONS_PACK_SOURCE.map((question) => question.textEn.toLowerCase()));
  const nextIndex: Record<string, number> = {};
  for (const question of QUIZ_QUESTIONS_PACK_SOURCE) {
    nextIndex[question.categoryId] = (nextIndex[question.categoryId] ?? 0) + 1;
  }

  const collected: Record<string, PackQuestion[]> = {};
  const token = await requestOpenTdbToken();

  for (const [categoryId, codes] of Object.entries(OPEN_TDB)) {
    collected[categoryId] = collected[categoryId] ?? [];
    for (const code of codes) {
      if (collected[categoryId].length >= TARGET_PER_CATEGORY) {
        break;
      }
      console.log(`OpenTDB ${categoryId} (${code})...`);
      const rows = await fetchOpenTdb(categoryId, code, token, seen);
      collected[categoryId].push(...rows);
      console.log(`  now ${collected[categoryId].length}`);
      await sleep(5500);
    }
  }

  for (const [categoryId, apiCategory] of Object.entries(TRIVIA_EXTRA)) {
    collected[categoryId] = collected[categoryId] ?? [];
    if (collected[categoryId].length >= TARGET_PER_CATEGORY) {
      continue;
    }
    console.log(`Trivia API ${categoryId} (${apiCategory})...`);
    const rows = await fetchTrivia(categoryId, apiCategory, seen);
    collected[categoryId].push(...rows);
    console.log(`  now ${collected[categoryId].length}`);
    await sleep(400);
  }

  const cache = loadCache();
  const built: string[] = [];
  let total = 0;

  for (const [categoryId, rows] of Object.entries(collected)) {
    const selected = rows.slice(0, TARGET_PER_CATEGORY);
    console.log(`Translate ${categoryId}: ${selected.length}`);
    let index = nextIndex[categoryId] ?? 0;
    for (const row of selected) {
      index += 1;
      const optionEn = [row.correct, ...row.incorrect];
      const text = await translateToRu(row.text, cache);
      const optionRu: string[] = [];
      for (const option of optionEn) {
        optionRu.push(
          shouldKeepEnglish(option, categoryId) ? option : await translateToRu(option, cache)
        );
      }
      built.push(formatQuestion(categoryId, index, text, row.text, optionRu, optionEn));
      total += 1;
    }
  }

  const out = `/** Extra pack questions from OpenTDB / The Trivia API. Do not edit by hand. */
import type { QuizQuestionSource } from './quizGameTypes';

export const QUIZ_QUESTIONS_PACK_EXPAND_SOURCE: QuizQuestionSource[] = [
${built.join(',\n')},
];
`;

  const outPath = path.join(__dirname, '../src/games/quizGameContentPackExpand.ts');
  fs.writeFileSync(outPath, out);
  console.log(`Wrote ${total} expansion questions to ${outPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

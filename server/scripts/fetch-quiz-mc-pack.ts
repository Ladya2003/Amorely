/**
 * Downloads multiple-choice questions from The Trivia API / OpenTDB.
 * Run: npx ts-node scripts/fetch-quiz-mc-pack.ts
 */
import * as fs from 'fs';
import * as path from 'path';

type PackQuestion = {
  categoryId: string;
  text: string;
  correct: string;
  incorrect: string[];
  source: string;
};

const TRIVIA_CATEGORIES: Record<string, string> = {
  cinema: 'film_and_tv',
  travel: 'geography',
  sport: 'sport_and_leisure',
  music: 'music',
  food: 'food_and_drink',
  nature: 'science',
  art: 'arts_and_literature',
  general: 'general_knowledge',
  history: 'history',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    .replace(/&deg;/g, '°');

const isUsable = (question: string, options: string[]) => {
  if (question.length > 140 || options.some((option) => option.length > 72)) {
    return false;
  }
  if (options.some((option) => /https?:\/\//i.test(option))) {
    return false;
  }
  return new Set(options.map((option) => option.trim().toLowerCase())).size === 4;
};

const fetchTriviaCategory = async (categoryId: string, apiCategory: string): Promise<PackQuestion[]> => {
  const collected: PackQuestion[] = [];
  const seen = new Set<string>();

  for (let page = 0; page < 2 && collected.length < 28; page += 1) {
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
      const key = text.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      collected.push({ categoryId, text, correct, incorrect, source: 'trivia-api' });
    }

    await sleep(400);
  }

  return collected.slice(0, 24);
};

const fetchOpenTdbComputers = async (): Promise<PackQuestion[]> => {
  const response = await fetch('https://opentdb.com/api.php?amount=40&category=18&type=multiple');
  if (!response.ok) {
    throw new Error(`OpenTDB computers: HTTP ${response.status}`);
  }
  const payload = (await response.json()) as {
    results?: Array<{
      question: string;
      correct_answer: string;
      incorrect_answers: string[];
    }>;
  };

  const collected: PackQuestion[] = [];
  const seen = new Set<string>();
  for (const row of payload.results ?? []) {
    const text = decodeHtml(row.question).trim();
    const correct = decodeHtml(row.correct_answer).trim();
    const incorrect = (row.incorrect_answers || []).map((item) => decodeHtml(item).trim()).slice(0, 3);
    if (incorrect.length !== 3 || !isUsable(text, [correct, ...incorrect])) {
      continue;
    }
    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    collected.push({ categoryId: 'tech', text, correct, incorrect, source: 'opentdb' });
  }
  return collected.slice(0, 24);
};

const main = async () => {
  const pack: Record<string, PackQuestion[]> = {};

  for (const [categoryId, apiCategory] of Object.entries(TRIVIA_CATEGORIES)) {
    console.log(`Fetching ${categoryId} (${apiCategory})...`);
    pack[categoryId] = await fetchTriviaCategory(categoryId, apiCategory);
    console.log(`  ${pack[categoryId].length} usable`);
    await sleep(300);
  }

  console.log('Fetching tech (OpenTDB computers)...');
  pack.tech = await fetchOpenTdbComputers();
  console.log(`  ${pack.tech.length} usable`);

  const outPath = path.join(__dirname, 'quiz-mc-pack-raw.json');
  fs.writeFileSync(outPath, JSON.stringify(pack, null, 2));
  console.log(`Wrote ${outPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

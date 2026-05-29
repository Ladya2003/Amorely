import { QUIZ_CATEGORIES, QUIZ_QUESTIONS } from './quizGameContent';

export { QUIZ_CATEGORIES, QUIZ_QUESTIONS };

export const QUIZ_LOBBY_COUNTDOWN_SEC = 3;
export const QUIZ_QUESTION_TIME_SEC = 30;
export const QUIZ_POINT_TIERS = [100, 200, 300] as const;
export const QUIZ_DAILY_CATEGORY_COUNT = 5;
export const QUIZ_QUESTIONS_PER_CATEGORY = 40;
export const QUIZ_BOARD_QUESTIONS_PER_CATEGORY = QUIZ_POINT_TIERS.length;

export type QuizPointTier = (typeof QUIZ_POINT_TIERS)[number];

export interface QuizCategory {
  id: string;
  name: string;
}

export interface QuizQuestion {
  id: string;
  categoryId: string;
  text: string;
  /** Допустимые варианты ответа (сравнение без учёта регистра) */
  answers: string[];
}

export const getQuizCellKey = (categoryId: string, points: number) => `${categoryId}:${points}`;

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

/** Детерминированное перемешивание для одного и того же boardDayKey. */
export const seededShuffle = <T>(items: T[], seed: string): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = hashString(`${seed}:${i}`) % (i + 1);
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
};

export const normalizeQuizAnswer = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

export const isQuizAnswerCorrect = (guess: string, acceptedAnswers: string[]) => {
  const normalizedGuess = normalizeQuizAnswer(guess);
  if (!normalizedGuess) {
    return false;
  }
  return acceptedAnswers.some((answer) => normalizeQuizAnswer(answer) === normalizedGuess);
};

export const getCategoryById = (categoryId: string) =>
  QUIZ_CATEGORIES.find((category) => category.id === categoryId) ?? null;

export const getQuestionsForCategory = (categoryId: string) =>
  QUIZ_QUESTIONS.filter((question) => question.categoryId === categoryId);

export const pickDailyCategories = (boardDayKey: string): QuizCategory[] => {
  const shuffled = seededShuffle(QUIZ_CATEGORIES, `categories:${boardDayKey}`);
  return shuffled.slice(0, QUIZ_DAILY_CATEGORY_COUNT);
};

export const pickDailyQuestionsForCategory = (
  categoryId: string,
  boardDayKey: string
): QuizQuestion[] => {
  const pool = getQuestionsForCategory(categoryId);
  if (pool.length < QUIZ_BOARD_QUESTIONS_PER_CATEGORY) {
    return [];
  }
  const shuffled = seededShuffle(pool, `questions:${boardDayKey}:${categoryId}`);
  return shuffled.slice(0, QUIZ_BOARD_QUESTIONS_PER_CATEGORY);
};

export interface QuizBoardCellPublic {
  cellKey: string;
  categoryId: string;
  categoryName: string;
  points: number;
  questionId: string;
  used: boolean;
}

export const buildDailyBoard = (boardDayKey: string): QuizBoardCellPublic[] => {
  const cells: QuizBoardCellPublic[] = [];
  const dailyCategories = pickDailyCategories(boardDayKey);

  for (const category of dailyCategories) {
    const questions = pickDailyQuestionsForCategory(category.id, boardDayKey);
    questions.forEach((question, index) => {
      const points = QUIZ_POINT_TIERS[index];
      cells.push({
        cellKey: getQuizCellKey(category.id, points),
        categoryId: category.id,
        categoryName: category.name,
        points,
        questionId: question.id,
        used: false,
      });
    });
  }

  return cells;
};

export const getQuizQuestionById = (questionId: string) =>
  QUIZ_QUESTIONS.find((question) => question.id === questionId) ?? null;

import { QUIZ_CATEGORIES, QUIZ_QUESTIONS } from './quizGameContent';
import type { QuizOptionId, QuizQuestion } from './quizGameTypes';
import { QUIZ_OPTION_IDS } from './quizGameTypes';

export { QUIZ_CATEGORIES, QUIZ_QUESTIONS };
export type { QuizOptionId, QuizQuestion, QuizQuestionOption } from './quizGameTypes';

export const QUIZ_CONTENT_VERSION = 4;
export const QUIZ_LOBBY_COUNTDOWN_SEC = 3;
export const QUIZ_QUESTION_TIME_SEC = 30;
export const QUIZ_POINT_TIERS = [100, 200, 300] as const;
export const QUIZ_DAILY_CATEGORY_COUNT = 5;
export const QUIZ_QUESTIONS_PER_CATEGORY = 20;
export const QUIZ_BOARD_QUESTIONS_PER_CATEGORY = QUIZ_POINT_TIERS.length;

export type QuizPointTier = (typeof QUIZ_POINT_TIERS)[number];

export interface QuizCategory {
  id: string;
  name: string;
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

export const isQuizOptionId = (value: string): value is QuizOptionId =>
  (QUIZ_OPTION_IDS as readonly string[]).includes(value);

export const isQuizOptionCorrect = (question: QuizQuestion, optionId: string) =>
  isQuizOptionId(optionId) && optionId === question.correctId;

export const getQuizOption = (question: QuizQuestion, optionId: string) =>
  question.options.find((option) => option.id === optionId) ?? null;

export const getShuffledQuizOptionIds = (question: QuizQuestion, seed: string): QuizOptionId[] =>
  seededShuffle(
    question.options.map((option) => option.id),
    seed
  );

export const getCategoryById = (categoryId: string) =>
  QUIZ_CATEGORIES.find((category) => category.id === categoryId) ?? null;

export const getQuestionsForCategory = (categoryId: string) =>
  QUIZ_QUESTIONS.filter((question) => question.categoryId === categoryId);

export const QUIZ_BOARD_CELL_COUNT = QUIZ_DAILY_CATEGORY_COUNT * QUIZ_BOARD_QUESTIONS_PER_CATEGORY;

export interface QuizBoardCellPublic {
  cellKey: string;
  categoryId: string;
  categoryName: string;
  points: number;
  questionId: string;
  used: boolean;
}

export const pickDailyCategories = (
  boardDayKey: string,
  relationshipId: string,
  seenQuestionIds: Set<string>
): QuizCategory[] => {
  const shuffled = seededShuffle(QUIZ_CATEGORIES, `categories:${boardDayKey}:${relationshipId}`);
  return shuffled
    .filter((category) => {
      const available = getQuestionsForCategory(category.id).filter(
        (question) => !seenQuestionIds.has(question.id)
      );
      return available.length >= QUIZ_BOARD_QUESTIONS_PER_CATEGORY;
    })
    .slice(0, QUIZ_DAILY_CATEGORY_COUNT);
};

export const pickDailyQuestionsForCategory = (
  categoryId: string,
  boardDayKey: string,
  relationshipId: string,
  seenQuestionIds: Set<string>,
  reservedQuestionIds: Set<string>
): QuizQuestion[] => {
  const pool = getQuestionsForCategory(categoryId).filter(
    (question) => !seenQuestionIds.has(question.id) && !reservedQuestionIds.has(question.id)
  );
  if (pool.length < QUIZ_BOARD_QUESTIONS_PER_CATEGORY) {
    return [];
  }
  const shuffled = seededShuffle(pool, `questions:${boardDayKey}:${relationshipId}:${categoryId}`);
  return shuffled.slice(0, QUIZ_BOARD_QUESTIONS_PER_CATEGORY);
};

export const countUnseenQuizQuestions = (seenQuestionIds: Set<string>) =>
  QUIZ_QUESTIONS.filter((question) => !seenQuestionIds.has(question.id)).length;

export interface DailyBoardBuildResult {
  cells: QuizBoardCellPublic[];
  didResetSeenPool: boolean;
}

export const buildDailyBoard = (
  boardDayKey: string,
  relationshipId: string,
  seenQuestionIds: Iterable<string> = []
): DailyBoardBuildResult => {
  let seen = new Set(seenQuestionIds);
  let didResetSeenPool = false;

  if (countUnseenQuizQuestions(seen) < QUIZ_BOARD_CELL_COUNT) {
    seen = new Set();
    didResetSeenPool = true;
  }

  const cells: QuizBoardCellPublic[] = [];
  const reservedQuestionIds = new Set<string>();
  const dailyCategories = pickDailyCategories(boardDayKey, relationshipId, seen);

  for (const category of dailyCategories) {
    const questions = pickDailyQuestionsForCategory(
      category.id,
      boardDayKey,
      relationshipId,
      seen,
      reservedQuestionIds
    );
    questions.forEach((question, index) => {
      reservedQuestionIds.add(question.id);
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

  return { cells, didResetSeenPool };
};

export const getQuizQuestionById = (questionId: string) =>
  QUIZ_QUESTIONS.find((question) => question.id === questionId) ?? null;

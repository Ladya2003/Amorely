import mongoose from 'mongoose';
import DailyQuestionsState from '../models/dailyQuestionsState';
import User from '../models/user';
import {
  DAILY_QUESTION_CATEGORIES,
  getCategoryById,
  pickRandomCategories,
  DailyQuestion,
} from '../dailyQuestions/dailyQuestionsContent';
import {
  getLocalizedAnswerLabel,
  getLocalizedCategoryTitle,
  localizeCategory,
} from '../dailyQuestions/dailyQuestionsI18n';
import { AppLocale } from '../i18n/locales';
import { findActiveRelationshipForUser } from '../utils/relationshipHelpers';
import { normalizeIdStr, idsEqual } from '../utils/normalizeId';
import { sendPushToUser } from './pushService';

const MS_24H = 24 * 60 * 60 * 1000;
const CATEGORIES_PER_ROUND = 2;

const generateRoundKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const getAnswerLabel = (
  categoryId: string,
  question: DailyQuestion,
  value: string,
  locale: AppLocale
): string => getLocalizedAnswerLabel(categoryId, question, value, locale);

const isCategoryFullyAnswered = (
  progress: { answers: { questionId: string }[] } | undefined,
  category: { questions: { id: string }[] }
) => {
  if (!progress) return false;
  const answeredIds = new Set(progress.answers.map((a) => a.questionId));
  return category.questions.every((q) => answeredIds.has(q.id));
};

const syncCategoryCompletion = (state: any, categoryId: string) => {
  const category = getCategoryById(categoryId);
  if (!category) return false;

  let changed = false;
  const userId = normalizeIdStr(state.userId);
  const partnerId = normalizeIdStr(state.partnerId);

  for (const uid of [userId, partnerId]) {
    if (!uid) continue;
    const progress = getUserProgress(state, uid, categoryId);
    if (!progress || progress.completedAt) continue;
    if (!isCategoryFullyAnswered(progress, category)) continue;

    progress.completedAt = new Date();
    changed = true;
    checkCategoryBothCompleted(state, categoryId);
  }

  if (changed) {
    checkBothCompletedAll(state);
  }
  return changed;
};

const syncAllCompletions = (state: any) => {
  let changed = false;
  for (const categoryId of state.categoryIds as string[]) {
    if (syncCategoryCompletion(state, categoryId)) {
      changed = true;
    }
  }
  return changed;
};

const answersMatch = (question: DailyQuestion, a: string, b: string): boolean => {
  if (question.type === 'text') {
    const na = normalizeText(a);
    const nb = normalizeText(b);
    if (!na || !nb) return false;
    if (na === nb) return true;
    const wordsA = new Set(na.split(' ').filter((w) => w.length > 2));
    const wordsB = new Set(nb.split(' ').filter((w) => w.length > 2));
    if (wordsA.size === 0 || wordsB.size === 0) return false;
    let overlap = 0;
    wordsA.forEach((w) => { if (wordsB.has(w)) overlap++; });
    return overlap / Math.max(wordsA.size, wordsB.size) >= 0.5;
  }
  return a === b;
};

export const calculateSimilarity = (
  categoryId: string,
  answersA: { questionId: string; value: string }[],
  answersB: { questionId: string; value: string }[]
): number => {
  const category = getCategoryById(categoryId);
  if (!category) return 0;

  let matched = 0;
  let total = 0;

  for (const question of category.questions) {
    const a = answersA.find((x) => x.questionId === question.id);
    const b = answersB.find((x) => x.questionId === question.id);
    if (!a?.value || !b?.value) continue;
    total++;
    if (answersMatch(question, a.value, b.value)) matched++;
  }

  if (total === 0) return 0;
  return Math.round((matched / total) * 100);
};

const getUserProgress = (
  state: any,
  userId: string,
  categoryId: string
) =>
  state.progress.find(
    (p: any) => idsEqual(p.userId, userId) && p.categoryId === categoryId
  );

const ensureUserProgress = (state: any, userId: string, categoryId: string) => {
  let entry = getUserProgress(state, userId, categoryId);
  if (!entry) {
    entry = {
      userId: new mongoose.Types.ObjectId(normalizeIdStr(userId)!),
      categoryId,
      answers: [],
      completedAt: null,
    };
    state.progress.push(entry);
  }
  return entry;
};

const checkCategoryBothCompleted = (state: any, categoryId: string) => {
  const userId = normalizeIdStr(state.userId);
  const partnerId = normalizeIdStr(state.partnerId);
  if (!userId || !partnerId) return;

  const userProg = getUserProgress(state, userId, categoryId);
  const partnerProg = getUserProgress(state, partnerId, categoryId);

  if (!userProg?.completedAt || !partnerProg?.completedAt) return;

  const existing = state.categoryBothCompleted.find(
    (c: any) => c.categoryId === categoryId
  );
  if (existing) return;

  const completedAt = new Date(
    Math.max(
      new Date(userProg.completedAt).getTime(),
      new Date(partnerProg.completedAt).getTime()
    )
  );

  state.categoryBothCompleted.push({ categoryId, completedAt });
};

const checkBothCompletedAll = (state: any) => {
  if (state.bothCompletedAllAt) return;

  const allDone = state.categoryIds.every((catId: string) =>
    state.categoryBothCompleted.some((c: any) => c.categoryId === catId)
  );

  if (!allDone) return;

  const latest = state.categoryBothCompleted.reduce(
    (max: number, c: any) => Math.max(max, new Date(c.completedAt).getTime()),
    0
  );
  state.bothCompletedAllAt = new Date(latest);
};

const archiveAndStartNewRound = (state: any) => {
  state.history.push({
    roundKey: state.roundKey,
    categoryIds: [...state.categoryIds],
    bothCompletedAllAt: state.bothCompletedAllAt,
    categoryBothCompleted: state.categoryBothCompleted.map((c: any) => ({
      categoryId: c.categoryId,
      completedAt: c.completedAt,
    })),
    progress: state.progress.map((p: any) => ({
      userId: p.userId,
      categoryId: p.categoryId,
      answers: p.answers.map((a: any) => ({ questionId: a.questionId, value: a.value })),
      completedAt: p.completedAt,
    })),
    archivedAt: new Date(),
  });

  const recentIds = state.history
    .slice(-5)
    .flatMap((h: any) => h.categoryIds as string[]);

  state.roundKey = generateRoundKey();
  state.categoryIds = pickRandomCategories(CATEGORIES_PER_ROUND, recentIds);
  state.roundStartedAt = new Date();
  state.bothCompletedAllAt = null;
  state.categoryBothCompleted = [];
  state.progress = [];
};

const maybeRotateRound = (state: any) => {
  if (!state.bothCompletedAllAt) return false;

  const elapsed = Date.now() - new Date(state.bothCompletedAllAt).getTime();
  if (elapsed < MS_24H) return false;

  archiveAndStartNewRound(state);
  return true;
};

export const getOrCreateState = async (userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    throw new Error('Invalid user id');
  }

  const relationship = await findActiveRelationshipForUser(normalizedUserId);
  if (!relationship) {
    return null;
  }

  const partnerId =
    idsEqual(relationship.userId, normalizedUserId)
      ? normalizeIdStr(relationship.partnerId)
      : normalizeIdStr(relationship.userId);

  if (!partnerId) return null;

  let state = await DailyQuestionsState.findOne({
    relationshipId: relationship._id,
    status: 'active',
  });

  if (!state) {
    state = new DailyQuestionsState({
      relationshipId: relationship._id,
      userId: relationship.userId,
      partnerId: relationship.partnerId,
      roundKey: generateRoundKey(),
      categoryIds: pickRandomCategories(CATEGORIES_PER_ROUND),
      roundStartedAt: new Date(),
      progress: [],
      categoryBothCompleted: [],
      history: [],
    });
    await state.save();
    return state;
  }

  const rotated = maybeRotateRound(state);
  const synced = syncAllCompletions(state);
  if (rotated || synced) {
    await state.save();
  }

  return state;
};

export interface CategoryStatus {
  id: string;
  emoji: string;
  title: string;
  questionCount: number;
  userCompleted: boolean;
  partnerCompleted: boolean;
  bothCompleted: boolean;
  bothCompletedAt: string | null;
  userProgress: number;
  partnerProgress: number;
}

export interface DailyQuestionsResponse {
  hasPartner: boolean;
  roundKey: string;
  categoryIds: string[];
  categories: CategoryStatus[];
  bothCompletedAllAt: string | null;
  nextRoundAt: string | null;
  msUntilNextRound: number | null;
  allCategories: { id: string; emoji: string; title: string }[];
}

const countAnsweredQuestions = (answers: { questionId: string }[] | undefined) =>
  new Set((answers ?? []).map((a) => a.questionId)).size;

const buildCategoryStatus = (
  state: any,
  userId: string,
  categoryId: string,
  locale: AppLocale
): CategoryStatus | null => {
  const category = getCategoryById(categoryId);
  if (!category) return null;

  const partnerId = idsEqual(state.userId, userId)
    ? normalizeIdStr(state.partnerId)
    : normalizeIdStr(state.userId);

  const userProg = getUserProgress(state, userId, categoryId);
  const partnerProg = partnerId ? getUserProgress(state, partnerId, categoryId) : null;

  const bothEntry = state.categoryBothCompleted.find(
    (c: any) => c.categoryId === categoryId
  );

  return {
    id: category.id,
    emoji: category.emoji,
    title: getLocalizedCategoryTitle(category.id, category.title, locale),
    questionCount: category.questions.length,
    userCompleted: Boolean(userProg?.completedAt),
    partnerCompleted: Boolean(partnerProg?.completedAt),
    bothCompleted: Boolean(bothEntry),
    bothCompletedAt: bothEntry?.completedAt?.toISOString() ?? null,
    userProgress: countAnsweredQuestions(userProg?.answers),
    partnerProgress: countAnsweredQuestions(partnerProg?.answers),
  };
};

export const buildDailyQuestionsResponse = (
  state: any,
  userId: string,
  locale: AppLocale = 'ru'
): DailyQuestionsResponse => {
  const categories = state.categoryIds
    .map((id: string) => buildCategoryStatus(state, userId, id, locale))
    .filter(Boolean) as CategoryStatus[];

  let nextRoundAt: string | null = null;
  let msUntilNextRound: number | null = null;

  if (state.bothCompletedAllAt) {
    const target = new Date(state.bothCompletedAllAt).getTime() + MS_24H;
    nextRoundAt = new Date(target).toISOString();
    msUntilNextRound = Math.max(0, target - Date.now());
  }

  return {
    hasPartner: true,
    roundKey: state.roundKey,
    categoryIds: state.categoryIds,
    categories,
    bothCompletedAllAt: state.bothCompletedAllAt?.toISOString() ?? null,
    nextRoundAt,
    msUntilNextRound,
    allCategories: DAILY_QUESTION_CATEGORIES.map((c) => ({
      id: c.id,
      emoji: c.emoji,
      title: getLocalizedCategoryTitle(c.id, c.title, locale),
    })),
  };
};

export const getCategoryQuestions = (categoryId: string, locale: AppLocale = 'ru') => {
  const category = getCategoryById(categoryId);
  if (!category) return null;
  const localized = localizeCategory(category, locale);
  return {
    id: localized.id,
    emoji: localized.emoji,
    title: localized.title,
    questions: localized.questions,
  };
};

export const submitAnswer = async (
  userId: string,
  categoryId: string,
  questionId: string,
  value: string,
  locale: AppLocale = 'ru'
) => {
  const state = await getOrCreateState(userId);
  if (!state) throw new Error('No active relationship');

  if (!state.categoryIds.includes(categoryId)) {
    throw new Error('Category not in current round');
  }

  const category = getCategoryById(categoryId);
  if (!category) throw new Error('Category not found');

  const question = category.questions.find((q) => q.id === questionId);
  if (!question) throw new Error('Question not found');

  if (question.type === 'choice') {
    const valid = question.options?.some((o) => o.id === value);
    if (!valid) throw new Error('Invalid choice');
  } else if (question.type === 'image') {
    const valid = question.images?.some((o) => o.id === value);
    if (!valid) throw new Error('Invalid image choice');
  } else if (!value.trim()) {
    throw new Error('Answer required');
  }

  const progress = ensureUserProgress(state, userId, categoryId);
  const existingIdx = progress.answers.findIndex(
    (a: any) => a.questionId === questionId
  );
  if (existingIdx >= 0) {
    progress.answers[existingIdx].value = value.trim();
  } else {
    progress.answers.push({ questionId, value: value.trim() });
  }

  if (isCategoryFullyAnswered(progress, category) && !progress.completedAt) {
    progress.completedAt = new Date();
    checkCategoryBothCompleted(state, categoryId);
    checkBothCompletedAll(state);
  }

  await state.save();
  return buildDailyQuestionsResponse(state, userId, locale);
};

export interface CategoryResultItem {
  questionId: string;
  questionText: string;
  questionType: string;
  userAnswer: string;
  userAnswerLabel: string;
  partnerAnswer: string | null;
  partnerAnswerLabel: string | null;
  isMatch: boolean | null;
}

export interface CategoryResults {
  categoryId: string;
  emoji: string;
  title: string;
  similarity: number | null;
  userCompleted: boolean;
  partnerCompleted: boolean;
  bothCompleted: boolean;
  items: CategoryResultItem[];
}

export const getCategoryResults = (
  state: any,
  userId: string,
  categoryId: string,
  locale: AppLocale = 'ru'
): CategoryResults | null => {
  const category = getCategoryById(categoryId);
  if (!category) return null;
  const localized = localizeCategory(category, locale);

  const partnerId = idsEqual(state.userId, userId)
    ? normalizeIdStr(state.partnerId)
    : normalizeIdStr(state.userId);

  const userProg = getUserProgress(state, userId, categoryId);
  const partnerProg = partnerId ? getUserProgress(state, partnerId, categoryId) : null;

  const bothEntry = state.categoryBothCompleted.find(
    (c: any) => c.categoryId === categoryId
  );

  const userAnswers = userProg?.answers ?? [];
  const partnerAnswers = partnerProg?.answers ?? [];

  const similarity =
    bothEntry && userAnswers.length && partnerAnswers.length
      ? calculateSimilarity(categoryId, userAnswers, partnerAnswers)
      : null;

  const items: CategoryResultItem[] = localized.questions.map((question) => {
    const userAns = userAnswers.find((a: any) => a.questionId === question.id);
    const partnerAns = partnerAnswers.find((a: any) => a.questionId === question.id);
    const baseQuestion = category.questions.find((q) => q.id === question.id)!;

    const userValue = userAns?.value ?? '';
    const partnerValue = partnerAns?.value ?? '';

    return {
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      userAnswer: userValue,
      userAnswerLabel: userValue
        ? getAnswerLabel(categoryId, baseQuestion, userValue, locale)
        : '',
      partnerAnswer: partnerValue || null,
      partnerAnswerLabel: partnerValue
        ? getAnswerLabel(categoryId, baseQuestion, partnerValue, locale)
        : null,
      isMatch:
        userValue && partnerValue
          ? answersMatch(baseQuestion, userValue, partnerValue)
          : null,
    };
  });

  return {
    categoryId: localized.id,
    emoji: localized.emoji,
    title: localized.title,
    similarity,
    userCompleted: Boolean(userProg?.completedAt),
    partnerCompleted: Boolean(partnerProg?.completedAt),
    bothCompleted: Boolean(bothEntry),
    items,
  };
};

export interface HistoryEntry {
  roundKey: string;
  categoryIds: string[];
  archivedAt: string;
  bothCompletedAllAt: string | null;
  categories: {
    id: string;
    emoji: string;
    title: string;
    similarity: number | null;
    userCompleted: boolean;
    partnerCompleted: boolean;
  }[];
}

export const getHistory = (state: any, userId: string, locale: AppLocale = 'ru'): HistoryEntry[] => {
  const partnerId = idsEqual(state.userId, userId)
    ? normalizeIdStr(state.partnerId)
    : normalizeIdStr(state.userId);

  return (state.history ?? [])
    .slice()
    .reverse()
    .map((round: any) => {
      const categories = (round.categoryIds as string[]).map((catId) => {
        const cat = getCategoryById(catId);
        const userProg = round.progress?.find(
          (p: any) => idsEqual(p.userId, userId) && p.categoryId === catId
        );
        const partnerProg = partnerId
          ? round.progress?.find(
              (p: any) => idsEqual(p.userId, partnerId) && p.categoryId === catId
            )
          : null;

        const bothDone =
          userProg?.completedAt &&
          partnerProg?.completedAt;

        const similarity =
          bothDone && userProg?.answers?.length && partnerProg?.answers?.length
            ? calculateSimilarity(catId, userProg.answers, partnerProg.answers)
            : null;

        return {
          id: catId,
          emoji: cat?.emoji ?? '❓',
          title: cat ? getLocalizedCategoryTitle(cat.id, cat.title, locale) : catId,
          similarity,
          userCompleted: Boolean(userProg?.completedAt),
          partnerCompleted: Boolean(partnerProg?.completedAt),
        };
      });

      return {
        roundKey: round.roundKey,
        categoryIds: round.categoryIds,
        archivedAt: round.archivedAt?.toISOString() ?? '',
        bothCompletedAllAt: round.bothCompletedAllAt?.toISOString() ?? null,
        categories,
      };
    });
};

const getUserDisplayName = (user: any) =>
  user.firstName || user.username || 'Партнёр';

export const notifyPartnerAboutQuestions = async (
  senderId: string,
  categoryId?: string
) => {
  const state = await getOrCreateState(senderId);
  if (!state) throw new Error('No active relationship');

  const partnerId = idsEqual(state.userId, senderId)
    ? normalizeIdStr(state.partnerId)
    : normalizeIdStr(state.userId);

  if (!partnerId) throw new Error('No partner');

  const sender = await User.findById(senderId);
  const senderName = sender ? getUserDisplayName(sender) : 'Партнёр';

  const category = categoryId ? getCategoryById(categoryId) : null;
  const body = category
    ? `${senderName} ждёт тебя в «${category.title}» — ответь на вопросы дня!`
    : `${senderName} приглашает пройти «Вопросы дня» вместе!`;

  await sendPushToUser(partnerId, {
    title: 'Вопросы дня 💬',
    body,
    url: '/',
    tag: 'daily-questions',
  });
};

export { MS_24H as DAILY_QUESTIONS_ROTATION_MS };

import type { QuizOptionId, QuizQuestion } from '../games/quizGameConfig';
import { getQuizOption } from '../games/quizGameConfig';
import { QUIZ_CATEGORY_I18N } from './generated/quizI18nData';
import { QUIZ_OPTION_I18N } from './generated/quizOptionsI18n';
import { QUIZ_QUESTION_I18N } from './generated/quizQuestionsI18n';
import { getLocalizedQuizField } from './quizI18nHelpers';
import { AppLocale, DEFAULT_LOCALE, getGameContentLocale } from './locales';

const getOptionI18nKey = (questionId: string, optionId: QuizOptionId) => `${questionId}:${optionId}`;

export const getQuizCategoryName = (categoryId: string, fallbackName: string, locale: AppLocale): string =>
  getLocalizedQuizField(QUIZ_CATEGORY_I18N, categoryId, getGameContentLocale(locale), fallbackName);

export const getQuizQuestionText = (question: QuizQuestion, locale: AppLocale): string =>
  getLocalizedQuizField(QUIZ_QUESTION_I18N, question.id, getGameContentLocale(locale), question.text);

export const getQuizOptionText = (
  question: QuizQuestion,
  optionId: QuizOptionId,
  locale: AppLocale
): string => {
  const fallback = getQuizOption(question, optionId)?.text ?? optionId;
  return getLocalizedQuizField(
    QUIZ_OPTION_I18N,
    getOptionI18nKey(question.id, optionId),
    getGameContentLocale(locale),
    fallback
  );
};

export const getQuizCorrectAnswer = (question: QuizQuestion, locale: AppLocale): string =>
  getQuizOptionText(question, question.correctId, locale);

export const resolveQuizLocale = (locale?: AppLocale | null): AppLocale => locale ?? DEFAULT_LOCALE;

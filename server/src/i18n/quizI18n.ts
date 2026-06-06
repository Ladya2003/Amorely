import type { QuizQuestion } from '../games/quizGameConfig';
import { QUIZ_ANSWER_EN } from './generated/quizAnswersEn';
import { QUIZ_CATEGORY_I18N } from './generated/quizI18nData';
import { QUIZ_QUESTION_EN } from './generated/quizQuestionsEn';
import { AppLocale, DEFAULT_LOCALE, getGameContentLocale } from './locales';

const isPrimarilyLatin = (value: string) => {
  const cyrillic = (value.match(/[а-яё]/gi) || []).length;
  const latin = (value.match(/[a-z]/gi) || []).length;
  return latin > cyrillic;
};

const formatAnswerDisplay = (answer: string) => {
  const trimmed = answer.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getQuizCategoryName = (categoryId: string, fallbackName: string, locale: AppLocale): string => {
  const contentLocale = getGameContentLocale(locale);
  const localized = QUIZ_CATEGORY_I18N[categoryId]?.[contentLocale];
  if (localized) {
    return localized;
  }

  if (contentLocale === 'ru') {
    return fallbackName;
  }

  return QUIZ_CATEGORY_I18N[categoryId]?.en ?? fallbackName;
};

export const getQuizQuestionText = (question: QuizQuestion, locale: AppLocale): string => {
  const contentLocale = getGameContentLocale(locale);
  if (contentLocale === 'ru') {
    return question.text;
  }

  return QUIZ_QUESTION_EN[question.id] ?? question.text;
};

export const getQuizCorrectAnswer = (question: QuizQuestion, locale: AppLocale): string => {
  const contentLocale = getGameContentLocale(locale);
  if (contentLocale === 'ru') {
    return question.answers[0];
  }

  const latinAnswer = question.answers.find(isPrimarilyLatin);
  if (latinAnswer) {
    return formatAnswerDisplay(latinAnswer);
  }

  return QUIZ_ANSWER_EN[question.id] ?? question.answers[0];
};

export const resolveQuizLocale = (locale?: AppLocale | null): AppLocale => locale ?? DEFAULT_LOCALE;

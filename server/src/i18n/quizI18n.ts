import type { QuizQuestion } from '../games/quizGameConfig';
import { QUIZ_ANSWER_I18N } from './generated/quizAnswersI18n';
import { QUIZ_CATEGORY_I18N } from './generated/quizI18nData';
import { QUIZ_QUESTION_I18N } from './generated/quizQuestionsI18n';
import { getLocalizedQuizField } from './quizI18nHelpers';
import { AppLocale, DEFAULT_LOCALE, getGameContentLocale } from './locales';

const isPrimarilyLatin = (value: string) => {
  const cyrillic = (value.match(/[а-яёіїєґ]/gi) || []).length;
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

const capitalizeDisplay = (answer: string) => {
  const trimmed = answer.trim();
  if (!trimmed || /^\d+$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const LOVE_LANGUAGE_ANSWER_TERMS = new Set([
  'words of affirmation',
  'acts of service',
  'receiving gifts',
  'quality time',
  'physical touch',
  'affirmation',
  'слова поддержки',
  'слова похвалы',
  'служение',
  'помощь',
  'дела',
  'подарки',
  'получение подарков',
  'качественное время',
  'время вместе',
  'время качества',
  'прикосновения',
  'физическое прикосновение',
  'аффирмация',
  'поддержки',
]);

/** English love-language terms → canonical Russian labels for reveal display */
const LOVE_LANGUAGE_DISPLAY_RU: Record<string, string> = {
  'words of affirmation': 'Слова поддержки',
  'acts of service': 'Помощь',
  'receiving gifts': 'Подарки',
  'quality time': 'Качественное время',
  'physical touch': 'Физическое прикосновение',
  affirmation: 'Аффирмация',
};

const getRussianDisplayAnswer = (question: QuizQuestion) => {
  const latinAnswer = question.answers.find(isPrimarilyLatin);
  if (latinAnswer) {
    const mapped = LOVE_LANGUAGE_DISPLAY_RU[latinAnswer.toLowerCase()];
    if (mapped) {
      return mapped;
    }
    return formatAnswerDisplay(latinAnswer);
  }

  const cyrillicAnswer = question.answers.find((answer) => !isPrimarilyLatin(answer));
  return capitalizeDisplay(cyrillicAnswer ?? question.answers[0]);
};

export const getQuizCategoryName = (categoryId: string, fallbackName: string, locale: AppLocale): string =>
  getLocalizedQuizField(QUIZ_CATEGORY_I18N, categoryId, getGameContentLocale(locale), fallbackName);

export const getQuizQuestionText = (question: QuizQuestion, locale: AppLocale): string =>
  getLocalizedQuizField(QUIZ_QUESTION_I18N, question.id, getGameContentLocale(locale), question.text);

export const getQuizCorrectAnswer = (question: QuizQuestion, locale: AppLocale): string => {
  const contentLocale = getGameContentLocale(locale);

  if (contentLocale === 'ru') {
    return getRussianDisplayAnswer(question);
  }

  const localized = QUIZ_ANSWER_I18N[question.id]?.[contentLocale];
  if (localized) {
    return formatAnswerDisplay(localized);
  }

  const latinAnswer = question.answers.find(isPrimarilyLatin);
  if (latinAnswer) {
    return formatAnswerDisplay(latinAnswer);
  }

  const englishAnswer = QUIZ_ANSWER_I18N[question.id]?.en;
  return englishAnswer ? formatAnswerDisplay(englishAnswer) : question.answers[0];
};

export const shouldShowLoveLanguagesHint = (question: QuizQuestion): boolean => {
  if (question.categoryId !== 'loveLanguages') {
    return false;
  }

  return question.answers.some((answer) => LOVE_LANGUAGE_ANSWER_TERMS.has(answer.toLowerCase()));
};

export const resolveQuizLocale = (locale?: AppLocale | null): AppLocale => locale ?? DEFAULT_LOCALE;

import { QUIZ_QUESTIONS_CUSTOM_SOURCE } from './quizGameContentCustom';
import { QUIZ_QUESTIONS_PACK_SOURCE } from './quizGameContentPack';
import { QUIZ_QUESTIONS_PACK_EXPAND_SOURCE } from './quizGameContentPackExpand';
import { toRuntimeQuizQuestion } from './quizGameTypes';

/** Полный пул категорий; на поле каждый день — 5 случайных. */
export const QUIZ_CATEGORIES = [
  { id: 'love', name: 'Любовь' },
  { id: 'cinema', name: 'Кино' },
  { id: 'travel', name: 'Путешествия' },
  { id: 'general', name: 'Общее' },
  { id: 'music', name: 'Музыка' },
  { id: 'food', name: 'Еда и кухня' },
  { id: 'nature', name: 'Наука и природа' },
  { id: 'loveLanguages', name: 'Языки любви' },
  { id: 'tech', name: 'Технологии и интернет' },
  { id: 'sport', name: 'Спорт' },
  { id: 'art', name: 'Искусство и литература' },
  { id: 'history', name: 'История' },
  { id: 'mythology', name: 'Мифология' },
  { id: 'animals', name: 'Животные' },
  { id: 'series', name: 'Сериалы' },
  { id: 'videoGames', name: 'Видеоигры' },
];

export const QUIZ_QUESTION_SOURCES = [
  ...QUIZ_QUESTIONS_CUSTOM_SOURCE,
  ...QUIZ_QUESTIONS_PACK_SOURCE,
  ...QUIZ_QUESTIONS_PACK_EXPAND_SOURCE,
];

export const QUIZ_QUESTIONS = QUIZ_QUESTION_SOURCES.map(toRuntimeQuizQuestion);

import type { DrawWord } from '../games/drawGameConfig';
import { DRAW_WORD_I18N } from './generated/drawWordsI18n';
import { DRAW_WORD_LOCALE_I18N } from './drawWordsLocales';
import { AppLocale, DEFAULT_LOCALE, GameContentLocale, getGameContentLocale } from './locales';

const getDrawWordLocaleEntry = (wordId: string, locale: GameContentLocale) =>
  DRAW_WORD_LOCALE_I18N[wordId]?.[locale] ?? DRAW_WORD_I18N[wordId]?.[locale];

const addGuessesFromLocales = (
  guesses: Set<string>,
  locales: (typeof DRAW_WORD_I18N)[string] | undefined
) => {
  if (!locales) {
    return;
  }

  for (const entry of Object.values(locales)) {
    if (entry?.label) {
      guesses.add(entry.label);
    }
    if (entry?.hint) {
      guesses.add(entry.hint);
    }
  }
};

export const getDrawWordLabel = (word: DrawWord, locale: AppLocale): string => {
  const contentLocale: GameContentLocale = getGameContentLocale(locale);
  const localized = getDrawWordLocaleEntry(word.id, contentLocale)?.label;
  if (localized) {
    return localized;
  }

  if (contentLocale === 'ru' || contentLocale === 'by' || contentLocale === 'uk') {
    return word.label;
  }

  return DRAW_WORD_I18N[word.id]?.en?.label ?? word.label;
};

export const getDrawWordAcceptedGuesses = (word: DrawWord): string[] => {
  const guesses = new Set<string>();

  guesses.add(word.label);
  if (word.hint) {
    guesses.add(word.hint);
  }

  addGuessesFromLocales(guesses, DRAW_WORD_I18N[word.id]);
  addGuessesFromLocales(guesses, DRAW_WORD_LOCALE_I18N[word.id]);

  return [...guesses];
};

export const getDrawWordLabelForLocale = (wordId: string, word: DrawWord | undefined, locale: AppLocale) => {
  if (!word) {
    return null;
  }
  return getDrawWordLabel(word, locale);
};

export const resolveDrawLocale = (locale?: AppLocale | null): AppLocale => locale ?? DEFAULT_LOCALE;

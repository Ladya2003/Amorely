import type { DrawWord } from '../games/drawGameConfig';
import { DRAW_WORD_I18N } from './generated/drawWordsI18n';
import { AppLocale, DEFAULT_LOCALE, GameContentLocale, getGameContentLocale } from './locales';

export const getDrawWordLabel = (word: DrawWord, locale: AppLocale): string => {
  const contentLocale: GameContentLocale = getGameContentLocale(locale);
  const localized = DRAW_WORD_I18N[word.id]?.[contentLocale]?.label;
  if (localized) {
    return localized;
  }

  if (contentLocale === 'ru') {
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

  const locales = DRAW_WORD_I18N[word.id];
  if (locales) {
    for (const entry of Object.values(locales)) {
      if (entry?.label) {
        guesses.add(entry.label);
      }
      if (entry?.hint) {
        guesses.add(entry.hint);
      }
    }
  }

  return [...guesses];
};

export const getDrawWordLabelForLocale = (wordId: string, word: DrawWord | undefined, locale: AppLocale) => {
  if (!word) {
    return null;
  }
  return getDrawWordLabel(word, locale);
};

export const resolveDrawLocale = (locale?: AppLocale | null): AppLocale => locale ?? DEFAULT_LOCALE;

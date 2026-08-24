import { AppLocale } from './locales';

export const normalizeQuizDisplayText = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

export const quizDisplayTextsAreUnique = (texts: string[]) => {
  const seen = new Set<string>();
  for (const text of texts) {
    const key = normalizeQuizDisplayText(text);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
  }
  return true;
};

export const getLocalizedQuizField = (
  map: Record<string, Partial<Record<AppLocale, string>>> | undefined,
  id: string,
  locale: AppLocale,
  ruFallback: string
): string => {
  const entry = map?.[id];
  if (!entry) {
    return ruFallback;
  }

  const localized = entry[locale];
  if (localized) {
    return localized;
  }

  if (locale === 'ru' || locale === 'by' || locale === 'uk') {
    return ruFallback;
  }

  return entry.en ?? ruFallback;
};

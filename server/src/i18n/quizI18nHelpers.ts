import { AppLocale } from './locales';

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

  if (locale === 'ru') {
    return ruFallback;
  }

  return entry.en ?? ruFallback;
};

import { AppLocale, SUPPORTED_LOCALES } from './locale';

export interface NewsLocaleContent {
  title: string;
  content: string;
}

export type NewsTranslations = Partial<Record<AppLocale, NewsLocaleContent>>;

export const createEmptyNewsTranslations = (): Record<AppLocale, NewsLocaleContent> =>
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, { title: '', content: '' }])
  ) as Record<AppLocale, NewsLocaleContent>;

export const normalizeNewsTranslations = (
  item: {
    title?: string;
    content?: string;
    translations?: NewsTranslations | null;
  }
): Record<AppLocale, NewsLocaleContent> => {
  const empty = createEmptyNewsTranslations();
  const source = item.translations ?? {};

  for (const locale of SUPPORTED_LOCALES) {
    const entry = source[locale];
    if (entry) {
      empty[locale] = {
        title: entry.title ?? '',
        content: entry.content ?? '',
      };
    }
  }

  if (!empty.ru.title.trim() && item.title?.trim()) {
    empty.ru = {
      title: item.title.trim(),
      content: item.content ?? '',
    };
  }

  return empty;
};

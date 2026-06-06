import { AppLocale, SUPPORTED_LOCALES } from './locales';

export interface NewsLocaleContent {
  title: string;
  content: string;
}

export type NewsTranslations = Partial<Record<AppLocale, NewsLocaleContent>>;

const emptyLocaleContent = (): NewsLocaleContent => ({ title: '', content: '' });

export const createEmptyNewsTranslations = (): Record<AppLocale, NewsLocaleContent> =>
  Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, emptyLocaleContent()])) as Record<
    AppLocale,
    NewsLocaleContent
  >;

export const normalizeNewsTranslations = (doc: {
  title?: string;
  content?: string;
  translations?: NewsTranslations | null;
}): NewsTranslations => {
  const translations: NewsTranslations = { ...(doc.translations ?? {}) };

  if (!translations.ru?.title?.trim() && doc.title?.trim()) {
    translations.ru = {
      title: doc.title.trim(),
      content: (doc.content ?? '').trim(),
    };
  }

  return translations;
};

export const getLocalizedNewsContent = (
  doc: {
    title?: string;
    content?: string;
    translations?: NewsTranslations | null;
  },
  locale: AppLocale
): NewsLocaleContent => {
  const translations = normalizeNewsTranslations(doc);
  const direct = translations[locale];
  if (direct?.title?.trim()) {
    return {
      title: direct.title.trim(),
      content: direct.content ?? '',
    };
  }

  if (locale !== 'ru') {
    const english = translations.en;
    if (english?.title?.trim()) {
      return {
        title: english.title.trim(),
        content: english.content ?? '',
      };
    }
  }

  const russian = translations.ru;
  if (russian?.title?.trim()) {
    return {
      title: russian.title.trim(),
      content: russian.content ?? '',
    };
  }

  return {
    title: doc.title?.trim() ?? '',
    content: doc.content ?? '',
  };
};

export const parseNewsTranslationsInput = (value: unknown): NewsTranslations | null => {
  if (!value) {
    return null;
  }

  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const translations: NewsTranslations = {};
  for (const locale of SUPPORTED_LOCALES) {
    const entry = (parsed as Record<string, unknown>)[locale];
    if (entry === undefined) {
      continue;
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      translations[locale] = { title: '', content: '' };
      continue;
    }
    const title = typeof (entry as NewsLocaleContent).title === 'string' ? (entry as NewsLocaleContent).title : '';
    const content =
      typeof (entry as NewsLocaleContent).content === 'string' ? (entry as NewsLocaleContent).content : '';
    translations[locale] = { title: title.trim(), content: content.trim() };
  }

  return translations;
};

export const syncLegacyNewsFields = (news: {
  title?: string;
  content?: string;
  translations?: NewsTranslations | null;
  set?: (key: string, value: unknown) => void;
}) => {
  const translations = normalizeNewsTranslations(news);
  const russian = translations.ru;
  const title = russian?.title?.trim() ?? '';
  const content = russian?.content ?? '';

  if (typeof news.set === 'function') {
    news.set('title', title);
    news.set('content', content);
    news.set('translations', translations);
    return;
  }

  news.title = title;
  news.content = content;
  news.translations = translations;
};

export const formatNewsForClient = (doc: any, locale: AppLocale) => {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const localized = getLocalizedNewsContent(obj, locale);
  const { translations: _translations, ...rest } = obj;
  return {
    ...rest,
    title: localized.title,
    content: localized.content,
  };
};

export const formatNewsForAdmin = (doc: any) => {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const translations = normalizeNewsTranslations(obj);
  return {
    ...obj,
    translations,
    title: translations.ru?.title ?? obj.title ?? '',
    content: translations.ru?.content ?? obj.content ?? '',
  };
};

import { AppLocale, SUPPORTED_LOCALES } from './locales';
import { AnnouncementLocaleContent, AnnouncementTranslations, AnnouncementTranslationsSource } from '../models/appAnnouncement';

export type { AnnouncementLocaleContent, AnnouncementTranslations, AnnouncementTranslationsSource };

export const createEmptyAnnouncementTranslations = (): Record<AppLocale, AnnouncementLocaleContent> =>
  Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, { title: '', preview: '', content: '' }])
  ) as Record<AppLocale, AnnouncementLocaleContent>;

export const normalizeAnnouncementTranslations = (doc: {
  translations?: AnnouncementTranslationsSource | null;
}): Record<AppLocale, AnnouncementLocaleContent> => {
  const empty = createEmptyAnnouncementTranslations();
  const source = doc.translations ?? {};

  for (const locale of SUPPORTED_LOCALES) {
    const entry = source[locale];
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    empty[locale] = {
      title: entry.title ?? '',
      preview: entry.preview ?? '',
      content: entry.content ?? '',
    };
  }

  return empty;
};

export const parseAnnouncementTranslationsInput = (
  value: unknown
): AnnouncementTranslations | null => {
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

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const translations: AnnouncementTranslations = {};
  for (const locale of SUPPORTED_LOCALES) {
    const entry = (parsed as Record<string, unknown>)[locale];
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const record = entry as Record<string, unknown>;
    translations[locale] = {
      title: typeof record.title === 'string' ? record.title : '',
      preview: typeof record.preview === 'string' ? record.preview : '',
      content: typeof record.content === 'string' ? record.content : '',
    };
  }

  return translations;
};

export const getLocalizedAnnouncementContent = (
  doc: {
    translations?: AnnouncementTranslationsSource | null;
  },
  locale: AppLocale
): AnnouncementLocaleContent => {
  const translations = normalizeAnnouncementTranslations(doc);
  const direct = translations[locale];
  if (direct?.title?.trim()) {
    return {
      title: direct.title.trim(),
      preview: direct.preview?.trim() ?? '',
      content: direct.content ?? '',
    };
  }

  if (locale !== 'ru') {
    const english = translations.en;
    if (english?.title?.trim()) {
      return {
        title: english.title.trim(),
        preview: english.preview?.trim() ?? '',
        content: english.content ?? '',
      };
    }
  }

  const russian = translations.ru;
  if (russian?.title?.trim()) {
    return {
      title: russian.title.trim(),
      preview: russian.preview?.trim() ?? '',
      content: russian.content ?? '',
    };
  }

  return { title: '', preview: '', content: '' };
};

export const formatAnnouncementForAdmin = (doc: any) => ({
  _id: doc._id.toString(),
  key: doc.key,
  translations: normalizeAnnouncementTranslations(doc),
  pushTitle: doc.pushTitle ?? 'Amorely',
  pushBody: doc.pushBody ?? '',
  isActive: Boolean(doc.isActive),
  publishedAt: doc.publishedAt,
  pushSentAt: doc.pushSentAt ?? null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

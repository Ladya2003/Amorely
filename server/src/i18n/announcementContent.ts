import { AppLocale } from './locales';
import { AnnouncementLocaleContent, AnnouncementTranslations } from '../models/appAnnouncement';

export const normalizeAnnouncementTranslations = (doc: {
  translations?: AnnouncementTranslations | null;
}): AnnouncementTranslations => ({ ...(doc.translations ?? {}) });

export const getLocalizedAnnouncementContent = (
  doc: {
    translations?: AnnouncementTranslations | null;
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

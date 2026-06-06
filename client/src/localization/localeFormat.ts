import { AppLocale, resolveAppLocale } from './locale';

export const LOCALE_BCP47: Record<AppLocale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  pt: 'pt-BR',
  uk: 'uk-UA',
};

export const formatLocalizedDate = (
  dateString: string,
  locale?: string | null
): string => {
  const appLocale = resolveAppLocale(locale ?? undefined);
  const date = new Date(dateString);
  return date.toLocaleDateString(LOCALE_BCP47[appLocale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

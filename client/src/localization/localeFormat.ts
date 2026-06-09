import { format } from 'date-fns';
import { AppLocale } from './locale';
import { getDateFnsLocale } from './calendarHelpers';

export const LOCALE_BCP47: Record<AppLocale, string> = {
  ru: 'ru-RU',
  en: 'en-GB',
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
  const date = new Date(dateString);
  return format(date, 'd MMMM yyyy', { locale: getDateFnsLocale(locale) });
};

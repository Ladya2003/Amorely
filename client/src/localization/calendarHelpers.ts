import { format } from 'date-fns';
import { ru } from 'date-fns/locale/ru';
import type { TFunction } from 'i18next';
import type { Locale } from 'date-fns';
import { AppLocale, resolveAppLocale } from './locale';
import {
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_SOURCE_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  formatMegabytes,
} from '../utils/mediaLimits';

const dateFnsLocaleCache: Partial<Record<AppLocale, Locale>> = { ru };

const dateFnsLocaleLoaders: Record<AppLocale, () => Promise<Locale>> = {
  ru: () => Promise.resolve(ru),
  en: () => import('date-fns/locale/en-US').then((module) => module.enUS),
  es: () => import('date-fns/locale/es').then((module) => module.es),
  de: () => import('date-fns/locale/de').then((module) => module.de),
  fr: () => import('date-fns/locale/fr').then((module) => module.fr),
  pt: () => import('date-fns/locale/pt-BR').then((module) => module.ptBR),
  uk: () => import('date-fns/locale/uk').then((module) => module.uk),
  by: () => import('date-fns/locale/be').then((module) => module.be),
};

/** ISO-style week: Monday first, Sunday last (matches calendar grid). */
const withMondayWeekStart = (locale: Locale): Locale => ({
  ...locale,
  options: {
    ...locale.options,
    weekStartsOn: 1,
  },
});

/** Day-first numeric format for date inputs and short date display. */
export const DATE_INPUT_FORMAT = 'dd/MM/yyyy';

/** Day-first format for datetime inputs (plans deadline, etc.). */
export const DATE_TIME_INPUT_FORMAT = `${DATE_INPUT_FORMAT} HH:mm`;

export const ensureDateFnsLocale = async (locale?: string | null): Promise<Locale> => {
  const appLocale = resolveAppLocale(locale ?? undefined);
  const cached = dateFnsLocaleCache[appLocale];
  if (cached) {
    return withMondayWeekStart(cached);
  }

  const loaded = await dateFnsLocaleLoaders[appLocale]();
  dateFnsLocaleCache[appLocale] = loaded;
  return withMondayWeekStart(loaded);
};

export const getDateFnsLocale = (locale?: string | null): Locale => {
  const appLocale = resolveAppLocale(locale ?? undefined);
  return withMondayWeekStart(dateFnsLocaleCache[appLocale] ?? ru);
};

export const formatNumericDate = (date: Date, locale?: string | null): string =>
  format(date, DATE_INPUT_FORMAT, { locale: getDateFnsLocale(locale) });

export const formatCalendarDate = (
  date: Date,
  locale?: string | null,
  pattern = 'd MMMM yyyy'
): string => format(date, pattern, { locale: getDateFnsLocale(locale) });

export const formatCalendarMonthYear = (date: Date, locale?: string | null): string =>
  format(date, 'LLLL yyyy', { locale: getDateFnsLocale(locale) });

export const formatCalendarDateTime = (date: Date, locale?: string | null): string =>
  format(date, `${DATE_INPUT_FORMAT} HH:mm`, { locale: getDateFnsLocale(locale) });

export const formatCalendarDeadlineDateTime = (date: Date, locale?: string | null): string =>
  format(date, 'd MMMM yyyy HH:mm', { locale: getDateFnsLocale(locale) });

export const getVideoLimitsHint = (t: TFunction): string =>
  t('calendar.media.videoHint', {
    sourceMb: formatMegabytes(MAX_VIDEO_SOURCE_BYTES),
    durationSec: MAX_VIDEO_DURATION_SEC,
    uploadMb: formatMegabytes(MAX_VIDEO_UPLOAD_BYTES),
  });

export const getCalendarWeekdays = (t: TFunction): string[] => {
  const weekdays = t('calendar.weekdays', { returnObjects: true, defaultValue: [] });
  return Array.isArray(weekdays) ? (weekdays as string[]) : [];
};

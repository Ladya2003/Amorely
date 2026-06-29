import { format } from 'date-fns';
import { de, enUS, es, fr, ptBR, ru, uk } from 'date-fns/locale';
import type { TFunction } from 'i18next';
import type { Locale } from 'date-fns';
import { AppLocale, resolveAppLocale } from './locale';
import {
  MAX_VIDEO_DURATION_SEC,
  MAX_VIDEO_SOURCE_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  formatMegabytes,
} from '../utils/mediaLimits';

const DATE_FNS_LOCALES: Record<AppLocale, Locale> = {
  ru,
  en: enUS,
  es,
  de,
  fr,
  pt: ptBR,
  uk,
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

export const getDateFnsLocale = (locale?: string | null): Locale => {
  const appLocale = resolveAppLocale(locale ?? undefined);
  return withMondayWeekStart(DATE_FNS_LOCALES[appLocale]);
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

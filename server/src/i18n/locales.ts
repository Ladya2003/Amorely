export const SUPPORTED_LOCALES = ['ru', 'en', 'es', 'de', 'fr', 'pt', 'uk'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'ru';

const LOCALE_ALIASES: Record<string, AppLocale> = {
  ru: 'ru',
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  es: 'es',
  'es-es': 'es',
  de: 'de',
  'de-de': 'de',
  fr: 'fr',
  'fr-fr': 'fr',
  pt: 'pt',
  'pt-br': 'pt',
  uk: 'uk',
  ua: 'uk',
};

export const resolveLocale = (value: string | null | undefined): AppLocale => {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.trim().toLowerCase().replace(/_/g, '-');
  return LOCALE_ALIASES[normalized] ?? DEFAULT_LOCALE;
};

export const isSupportedLocale = (value: string): value is AppLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

/** All supported UI locales have dedicated game content (with en/ru fallbacks where missing). */
export type GameContentLocale = AppLocale;

export const getGameContentLocale = (locale: AppLocale): GameContentLocale => locale;

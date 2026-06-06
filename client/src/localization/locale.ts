export const SUPPORTED_LOCALES = ['ru', 'en', 'es', 'de', 'fr', 'pt', 'uk'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  pt: 'Português',
  uk: 'Українська',
};

const LOCALE_ALIASES: Record<string, AppLocale> = {
  ru: 'ru',
  en: 'en',
  'en-us': 'en',
  'en-gb': 'en',
  es: 'es',
  de: 'de',
  fr: 'fr',
  pt: 'pt',
  'pt-br': 'pt',
  uk: 'uk',
  ua: 'uk',
};

export const resolveAppLocale = (value: string | null | undefined): AppLocale => {
  if (!value) {
    return 'ru';
  }
  const normalized = value.trim().toLowerCase().replace(/_/g, '-');
  return LOCALE_ALIASES[normalized] ?? 'ru';
};

export const isSupportedLocale = (value: string): value is AppLocale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

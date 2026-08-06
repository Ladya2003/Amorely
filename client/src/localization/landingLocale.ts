import {
  AppLocale,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  resolveAppLocale,
} from './locale';

export const LANDING_LOCALES = SUPPORTED_LOCALES;

export const SITE_ORIGIN = 'https://amorely.love';

export const getLandingPath = (locale: AppLocale, hash = ''): string => {
  const normalizedHash = hash && !hash.startsWith('#') ? `#${hash}` : hash;
  return `/${locale}${normalizedHash}`;
};

export const getLandingUrl = (locale: AppLocale, hash = ''): string =>
  `${SITE_ORIGIN}${getLandingPath(locale, hash)}`;

/** True when the first URL segment is a supported landing locale (e.g. `es`). */
export const isLandingLocaleSegment = (segment: string | null | undefined): segment is AppLocale => {
  if (!segment) {
    return false;
  }
  return isSupportedLocale(segment.trim().toLowerCase());
};

/**
 * Prefer stored UI locale, then browser language, then Russian (app fallbackLng).
 * Used for `/` → `/{locale}` redirects for guests.
 */
export const resolvePreferredLandingLocale = (): AppLocale => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('locale');
    if (stored) {
      return resolveAppLocale(stored);
    }

    const browser = window.navigator.language || window.navigator.languages?.[0];
    if (browser) {
      const normalized = browser.trim().toLowerCase().replace(/_/g, '-');
      const base = normalized.split('-')[0] ?? normalized;
      if (isSupportedLocale(base)) {
        return base;
      }
      return resolveAppLocale(normalized);
    }
  }

  return 'ru';
};

import i18next, { changeLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { AppLocale, resolveAppLocale } from './locale';

const localeLoaders: Record<AppLocale, () => Promise<{ default: Record<string, unknown> }>> = {
  ru: () => import('../locales/ru.json'),
  en: () => import('../locales/en.json'),
  es: () => import('../locales/es.json'),
  de: () => import('../locales/de.json'),
  fr: () => import('../locales/fr.json'),
  pt: () => import('../locales/pt.json'),
  uk: () => import('../locales/uk.json'),
  by: () => import('../locales/by.json'),
};

const loadedLocales = new Set<AppLocale>();

const detectInitialLocale = (): AppLocale => {
  if (typeof window === 'undefined') {
    return 'ru';
  }

  const storedLocale = window.localStorage.getItem('locale');
  if (storedLocale) {
    return resolveAppLocale(storedLocale);
  }

  return resolveAppLocale(window.navigator.language);
};

export const loadAppLocale = async (locale: string): Promise<AppLocale> => {
  const normalized = resolveAppLocale(locale);
  if (loadedLocales.has(normalized)) {
    return normalized;
  }

  const bundle = await localeLoaders[normalized]();
  i18next.addResourceBundle(normalized, 'translation', bundle.default, true, true);
  loadedLocales.add(normalized);
  return normalized;
};

export const initAppI18n = async (): Promise<void> => {
  const initialLocale = detectInitialLocale();
  const bundle = await localeLoaders[initialLocale]();
  loadedLocales.add(initialLocale);

  await i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        [initialLocale]: { translation: bundle.default },
      },
      lng: initialLocale,
      fallbackLng: initialLocale,
      supportedLngs: ['ru', 'en', 'by', 'uk', 'es', 'de', 'fr', 'pt'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'locale',
        caches: ['localStorage'],
        convertDetectedLanguage: (lng) => resolveAppLocale(lng),
      },
    });
};

export const setAppLocale = (locale: string) => {
  const normalized = resolveAppLocale(locale);
  localStorage.setItem('locale', normalized);
  void loadAppLocale(normalized).then(() => changeLanguage(normalized));
  return normalized;
};

export default i18next;

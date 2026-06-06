import i18next, { changeLanguage } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from '../locales/ru.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import pt from '../locales/pt.json';
import uk from '../locales/uk.json';
import { resolveAppLocale } from './locale';

const resources = {
  ru: { translation: ru },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  pt: { translation: pt },
  uk: { translation: uk },
};

const storedLocale = localStorage.getItem('locale');

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLocale ? resolveAppLocale(storedLocale) : undefined,
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'en', 'es', 'de', 'fr', 'pt', 'uk'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'locale',
      caches: ['localStorage'],
    },
  });

export const setAppLocale = (locale: string) => {
  const normalized = resolveAppLocale(locale);
  localStorage.setItem('locale', normalized);
  void changeLanguage(normalized);
  return normalized;
};

export default i18next;

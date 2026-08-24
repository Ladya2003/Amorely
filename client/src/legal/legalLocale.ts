import { resolveAppLocale } from '../localization/locale';

export type LegalLocale = 'ru' | 'en';

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export type LegalDocument = {
  intro: string;
  sections: LegalSection[];
};

/** BY-law documents stay in Russian for ru/by/uk; other UI locales use English. */
export const resolveLegalLocale = (language: string): LegalLocale => {
  const locale = resolveAppLocale(language);
  switch (locale) {
    case 'ru':
    case 'by':
    case 'uk':
      return 'ru';
    case 'en':
    case 'es':
    case 'de':
    case 'fr':
    case 'pt':
      return 'en';
    default: {
      const _never: never = locale;
      return _never;
    }
  }
};

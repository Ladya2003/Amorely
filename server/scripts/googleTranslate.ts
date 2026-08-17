import type { AppLocale } from '../src/i18n/locales';

const GOOGLE_LANG: Partial<Record<AppLocale, string>> = {
  by: 'be',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const toGoogleLang = (locale: AppLocale): string => GOOGLE_LANG[locale] ?? locale;

export const translateText = async (text: string, targetLang: AppLocale, attempt = 0): Promise<string> => {
  const tl = toGoogleLang(targetLang);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as [Array<[string]>, ...unknown[]];
    return data[0].map((part) => part[0]).join('');
  } catch (error) {
    if (attempt >= 4) {
      throw new Error(`Translate failed for "${text}" -> ${targetLang}: ${error}`);
    }

    const delay = 500 * 2 ** attempt;
    console.warn(`  retry ${attempt + 1}/4 in ${delay}ms (${targetLang}): ${text.slice(0, 60)}...`);
    await sleep(delay);
    return translateText(text, targetLang, attempt + 1);
  }
};

import { AppLocale, resolveAppLocale } from './locale';
import { LANDING_LOCALES, SITE_ORIGIN, getLandingUrl } from './landingLocale';

const OG_LOCALES: Record<AppLocale, string> = {
  en: 'en_US',
  ru: 'ru_RU',
  uk: 'uk_UA',
  by: 'be_BY',
  de: 'de_DE',
  es: 'es_ES',
  fr: 'fr_FR',
  pt: 'pt_PT',
};

export interface LandingDocumentSeoInput {
  language: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
}

const setMetaContent = (selector: string, content: string): string | null => {
  const el = document.querySelector(selector);
  if (!el) {
    return null;
  }
  const previous = el.getAttribute('content');
  el.setAttribute('content', content);
  return previous;
};

const setLinkHref = (rel: string, href: string): string | null => {
  const el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    return null;
  }
  const previous = el.getAttribute('href');
  el.setAttribute('href', href);
  return previous;
};

const readHreflangLinks = () =>
  Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map((el) => ({
    hreflang: el.getAttribute('hreflang'),
    href: el.getAttribute('href'),
  }));

const writeHreflangLinks = (items: { hreflang: string; href: string }[]) => {
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  const canonical = document.querySelector('link[rel="canonical"]');
  items.forEach(({ hreflang, href }) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', href);
    if (canonical?.parentNode) {
      canonical.parentNode.insertBefore(link, canonical.nextSibling);
    } else {
      document.head.appendChild(link);
    }
  });
};

/** Sync landing title/description/OG/twitter/canonical/hreflang and <html lang>. */
export const applyLandingDocumentSeo = (input: LandingDocumentSeoInput): (() => void) => {
  const locale = resolveAppLocale(input.language);
  const pageUrl = getLandingUrl(locale);
  const previousTitle = document.title;
  const previousLang = document.documentElement.lang;
  const previousDescription = setMetaContent('meta[name="description"]', input.description);
  const previousKeywords = setMetaContent('meta[name="keywords"]', input.keywords);
  const previousOgTitle = setMetaContent('meta[property="og:title"]', input.ogTitle);
  const previousOgDescription = setMetaContent(
    'meta[property="og:description"]',
    input.ogDescription
  );
  const previousOgLocale = setMetaContent('meta[property="og:locale"]', OG_LOCALES[locale]);
  const previousOgUrl = setMetaContent('meta[property="og:url"]', pageUrl);
  const previousTwitterTitle = setMetaContent('meta[name="twitter:title"]', input.ogTitle);
  const previousTwitterDescription = setMetaContent(
    'meta[name="twitter:description"]',
    input.ogDescription
  );
  const previousCanonical = setLinkHref('canonical', pageUrl);
  const previousHreflang = readHreflangLinks();

  writeHreflangLinks([
    ...LANDING_LOCALES.map((code) => ({
      hreflang: code,
      href: getLandingUrl(code),
    })),
    { hreflang: 'x-default', href: `${SITE_ORIGIN}/` },
  ]);

  document.title = input.title;
  document.documentElement.lang = locale;

  return () => {
    document.title = previousTitle;
    document.documentElement.lang = previousLang;
    if (previousDescription !== null) {
      setMetaContent('meta[name="description"]', previousDescription);
    }
    if (previousKeywords !== null) {
      setMetaContent('meta[name="keywords"]', previousKeywords);
    }
    if (previousOgTitle !== null) {
      setMetaContent('meta[property="og:title"]', previousOgTitle);
    }
    if (previousOgDescription !== null) {
      setMetaContent('meta[property="og:description"]', previousOgDescription);
    }
    if (previousOgLocale !== null) {
      setMetaContent('meta[property="og:locale"]', previousOgLocale);
    }
    if (previousOgUrl !== null) {
      setMetaContent('meta[property="og:url"]', previousOgUrl);
    }
    if (previousTwitterTitle !== null) {
      setMetaContent('meta[name="twitter:title"]', previousTwitterTitle);
    }
    if (previousTwitterDescription !== null) {
      setMetaContent('meta[name="twitter:description"]', previousTwitterDescription);
    }
    if (previousCanonical !== null) {
      setLinkHref('canonical', previousCanonical);
    }
    writeHreflangLinks(
      previousHreflang.filter(
        (item): item is { hreflang: string; href: string } =>
          Boolean(item.hreflang && item.href)
      )
    );
  };
};

import { AppLocale, resolveAppLocale } from './locale';
import { SITE_ORIGIN } from './landingLocale';

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

const JSON_LD_ATTR = 'data-amorely-public-jsonld';

export type PublicPageOgImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export type PublicPageSeoInput = {
  language: string;
  title: string;
  description: string;
  keywords: string;
  path: string;
  ogType?: 'website' | 'article';
  ogImage?: PublicPageOgImage;
  jsonLd?: Record<string, unknown>[];
};

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

const jsonLdSelector = 'script[type="application/ld+json"]';

const removePublicJsonLd = () => {
  document.querySelectorAll(`script[${JSON_LD_ATTR}]`).forEach((el) => el.remove());
};

const readForeignJsonLd = (): string[] =>
  Array.from(document.querySelectorAll(`${jsonLdSelector}:not([${JSON_LD_ATTR}])`))
    .map((el) => el.textContent)
    .filter((text): text is string => Boolean(text));

const removeForeignJsonLd = () => {
  document.querySelectorAll(`${jsonLdSelector}:not([${JSON_LD_ATTR}])`).forEach((el) => el.remove());
};

const restoreForeignJsonLd = (texts: string[]) => {
  texts.forEach((text) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = text;
    document.head.appendChild(script);
  });
};

const writePublicJsonLd = (blocks: Record<string, unknown>[]) => {
  removePublicJsonLd();
  const marker = document.querySelector(jsonLdSelector);
  blocks.forEach((schema) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute(JSON_LD_ATTR, 'true');
    script.textContent = JSON.stringify(schema);
    if (marker?.parentNode) {
      marker.parentNode.insertBefore(script, marker);
    } else {
      document.head.appendChild(script);
    }
  });
};

export const getPublicPageUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
};

/** Sync title/description/OG/twitter/canonical for a public page. Does not reuse landing URLs. */
export const applyPublicDocumentSeo = (input: PublicPageSeoInput): (() => void) => {
  const locale = resolveAppLocale(input.language);
  const pageUrl = getPublicPageUrl(input.path);
  const ogImage = input.ogImage ?? {
    url: `${SITE_ORIGIN}/logo512.png`,
    alt: 'Amorely logo',
    width: 512,
    height: 512,
  };
  const previousTitle = document.title;
  const previousLang = document.documentElement.lang;
  const previousDescription = setMetaContent('meta[name="description"]', input.description);
  const previousKeywords = setMetaContent('meta[name="keywords"]', input.keywords);
  const previousOgType = setMetaContent('meta[property="og:type"]', input.ogType ?? 'website');
  const previousOgTitle = setMetaContent('meta[property="og:title"]', input.title);
  const previousOgDescription = setMetaContent('meta[property="og:description"]', input.description);
  const previousOgLocale = setMetaContent('meta[property="og:locale"]', OG_LOCALES[locale]);
  const previousOgUrl = setMetaContent('meta[property="og:url"]', pageUrl);
  const previousOgImage = setMetaContent('meta[property="og:image"]', ogImage.url);
  const previousOgImageAlt = setMetaContent('meta[property="og:image:alt"]', ogImage.alt);
  const previousOgImageWidth = ogImage.width
    ? setMetaContent('meta[property="og:image:width"]', String(ogImage.width))
    : null;
  const previousOgImageHeight = ogImage.height
    ? setMetaContent('meta[property="og:image:height"]', String(ogImage.height))
    : null;
  const previousTwitterTitle = setMetaContent('meta[name="twitter:title"]', input.title);
  const previousTwitterDescription = setMetaContent(
    'meta[name="twitter:description"]',
    input.description
  );
  const previousTwitterImage = setMetaContent('meta[name="twitter:image"]', ogImage.url);
  const previousCanonical = setLinkHref('canonical', pageUrl);
  const previousHreflang = readHreflangLinks();
  const previousForeignJsonLd = readForeignJsonLd();

  writeHreflangLinks([]);
  removeForeignJsonLd();
  writePublicJsonLd(input.jsonLd ?? []);

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
    if (previousOgType !== null) {
      setMetaContent('meta[property="og:type"]', previousOgType);
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
    if (previousOgImage !== null) {
      setMetaContent('meta[property="og:image"]', previousOgImage);
    }
    if (previousOgImageAlt !== null) {
      setMetaContent('meta[property="og:image:alt"]', previousOgImageAlt);
    }
    if (previousOgImageWidth !== null) {
      setMetaContent('meta[property="og:image:width"]', previousOgImageWidth);
    }
    if (previousOgImageHeight !== null) {
      setMetaContent('meta[property="og:image:height"]', previousOgImageHeight);
    }
    if (previousTwitterTitle !== null) {
      setMetaContent('meta[name="twitter:title"]', previousTwitterTitle);
    }
    if (previousTwitterDescription !== null) {
      setMetaContent('meta[name="twitter:description"]', previousTwitterDescription);
    }
    if (previousTwitterImage !== null) {
      setMetaContent('meta[name="twitter:image"]', previousTwitterImage);
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
    removePublicJsonLd();
    restoreForeignJsonLd(previousForeignJsonLd);
  };
};

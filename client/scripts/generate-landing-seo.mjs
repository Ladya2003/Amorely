/**
 * Generates:
 * 1) public/index.html — root hub (CRA template) + hreflang to /{lang}
 * 2) public/{lang}/index.html — locale landings for Ctrl+U in dev + GH Pages
 * 3) scripts/seo-locale-payloads.json — per-locale SEO for postbuild inject
 *    (postbuild overwrites build/{lang}/index.html with hashed CRA bundles)
 *
 * Usage: node scripts/generate-landing-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '..');
const localesDir = path.join(clientRoot, 'src', 'locales');
const indexPath = path.join(clientRoot, 'public', 'index.html');
const payloadsPath = path.join(__dirname, 'seo-locale-payloads.json');

const LOCALES = ['en', 'ru', 'uk', 'by', 'de', 'es', 'fr', 'pt'];
const SITE_ORIGIN = 'https://amorely.love';
const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/amorely.love',
  tiktok: 'https://www.tiktok.com/@amorely.love',
  youtube: 'https://youtu.be/pnCo-TeEztY',
};
const SOCIAL_SAME_AS = [SOCIAL_LINKS.instagram, SOCIAL_LINKS.tiktok, SOCIAL_LINKS.youtube];
const FEATURE_IDS = [
  'feed',
  'questions',
  'pets',
  'dateIdeas',
  'daysTogether',
  'chat',
  'guessLocation',
  'guessLocationResult',
  'guessDrawing',
  'calendar',
];
const VALUE_IDS = ['private', 'forTwo', 'anywhere'];
const FREE_POINT_IDS = ['noPaywall', 'fullAccess', 'invitePartner'];
const FAQ_IDS = ['free', 'private', 'partner', 'distance', 'features', 'devices'];
const REVIEW_IDS = ['anya', 'arseniy', 'tanya', 'lesha', 'andrey'];

const OG_LOCALES = {
  en: 'en_US',
  ru: 'ru_RU',
  uk: 'uk_UA',
  by: 'be_BY',
  de: 'de_DE',
  es: 'es_ES',
  fr: 'fr_FR',
  pt: 'pt_PT',
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const readLocaleJson = (lang) => {
  let raw = fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) {
    raw = raw.slice(1);
  }
  return JSON.parse(raw);
};

const loadLandingByLocale = () => {
  const byLocale = {};
  for (const lang of LOCALES) {
    const landing = readLocaleJson(lang).auth?.landing;
    if (
      !landing?.faq?.items ||
      !landing?.free ||
      !landing?.closing ||
      !landing?.reviews?.items ||
      !landing?.social
    ) {
      throw new Error(`Missing auth.landing SEO keys in ${lang}.json`);
    }
    byLocale[lang] = landing;
  }
  return byLocale;
};

const hreflangLinksHtml = () =>
  [
    ...LOCALES.map(
      (lang) =>
        `    <link rel="alternate" hreflang="${lang}" href="${SITE_ORIGIN}/${lang}" />`
    ),
    `    <link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/" />`,
  ].join('\n');

const renderLanguageBlock = (lang, landing) => {
  const e = escapeHtml;
  const featureArticles = FEATURE_IDS.map(
    (id) => `            <article>
              <h3>${e(landing.features[id].title)}</h3>
              <p>${e(landing.features[id].body)}</p>
            </article>`
  ).join('\n');

  const freePoints = FREE_POINT_IDS.map(
    (id) => `              <li>${e(landing.free.points[id])}</li>`
  ).join('\n');

  const valueItems = VALUE_IDS.map(
    (id) => `              <li>
                <strong>${e(landing.closing.values[id].title)}</strong> —
                ${e(landing.closing.values[id].body)}
              </li>`
  ).join('\n');

  const reviewItems = REVIEW_IDS.map(
    (id) => `            <article itemscope itemtype="https://schema.org/Review">
              <img src="${SITE_ORIGIN}/landing/reviews/${id}.jpg" alt="${e(landing.reviews.items[id].imageAlt)}" width="160" height="160" />
              <h3 itemprop="author" itemscope itemtype="https://schema.org/Person"><span itemprop="name">${e(landing.reviews.items[id].name)}</span></h3>
              <blockquote itemprop="reviewBody">${e(landing.reviews.items[id].quote)}</blockquote>
              <div itemprop="itemReviewed" itemscope itemtype="https://schema.org/WebApplication">
                <meta itemprop="name" content="Amorely" />
                <link itemprop="url" href="${SITE_ORIGIN}/" />
              </div>
            </article>`
  ).join('\n');

  const faqItems = FAQ_IDS.map(
    (id) => `            <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
              <h3 itemprop="name">${e(landing.faq.items[id].question)}</h3>
              <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                <p itemprop="text">${e(landing.faq.items[id].answer)}</p>
              </div>
            </div>`
  ).join('\n');

  return `        <div lang="${lang}">
          <header>
            <p>Amorely</p>
            <h2>${e(landing.heroTitle)}</h2>
            <p>${e(landing.heroLead)}</p>
            <p>
              <a href="/${lang}#auth-section">${e(landing.ctaLogin)}</a>
              ·
              <a href="/${lang}#auth-section">${e(landing.ctaRegister)}</a>
            </p>
          </header>

          <section aria-label="${e(landing.ariaLabel)}">
            <h2>${e(landing.featuresTitle)}</h2>
${featureArticles}
          </section>

          <section aria-label="${e(landing.free.ariaLabel)}">
            <h2>${e(landing.free.title)}</h2>
            <p>${e(landing.free.lead)}</p>
            <ul>
${freePoints}
            </ul>
          </section>

          <section aria-label="${e(landing.closing.ariaLabel)}">
            <h1>${e(landing.closing.title)}</h1>
            <p>${e(landing.closing.lead)}</p>
            <ul>
${valueItems}
            </ul>
          </section>

          <section aria-label="${e(landing.reviews.ariaLabel)}">
            <h2>${e(landing.reviews.title)}</h2>
            <p>${e(landing.reviews.lead)}</p>
${reviewItems}
          </section>

          <section aria-label="${e(landing.faq.ariaLabel)}" itemscope itemtype="https://schema.org/FAQPage">
            <h2>${e(landing.faq.title)}</h2>
${faqItems}
          </section>

          <section aria-label="${e(landing.social.ariaLabel)}">
            <h2>${e(landing.social.title)}</h2>
            <p>${e(landing.social.lead)}</p>
            <nav>
              <a href="${SOCIAL_LINKS.instagram}" rel="noopener noreferrer">Instagram</a>
              ·
              <a href="${SOCIAL_LINKS.tiktok}" rel="noopener noreferrer">TikTok</a>
              ·
              <a href="${SOCIAL_LINKS.youtube}" rel="noopener noreferrer">YouTube</a>
            </nav>
          </section>
        </div>`;
};

const indentJson = (value, spaces = 6) => {
  const pad = ' '.repeat(spaces);
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((line) => `${pad}${line}`)
    .join('\n');
};

const buildLocaleJsonLd = (lang, landing, byLocale, pageUrl = `${SITE_ORIGIN}/${lang}`) => {
  const scripts = [];

  scripts.push({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Amorely',
    url: SITE_ORIGIN + '/',
    logo: `${SITE_ORIGIN}/logo512.png`,
    description: landing.documentDescription,
    knowsLanguage: LOCALES,
    sameAs: SOCIAL_SAME_AS,
  });

  scripts.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Amorely',
    url: SITE_ORIGIN + '/',
    description: landing.documentDescription,
    inLanguage: LOCALES,
    publisher: {
      '@type': 'Organization',
      name: 'Amorely',
      url: SITE_ORIGIN + '/',
      logo: `${SITE_ORIGIN}/logo512.png`,
    },
    potentialAction: {
      '@type': 'RegisterAction',
      name: landing.ctaRegister,
      inLanguage: lang,
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${pageUrl}#auth-section`,
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
        ],
      },
    },
  });

  scripts.push({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Amorely',
    url: pageUrl,
    description: landing.documentDescription,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    inLanguage: lang,
    isAccessibleForFree: true,
    featureList: FEATURE_IDS.map((id) => landing.features[id].title),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    image: `${SITE_ORIGIN}/logo512.png`,
    publisher: {
      '@type': 'Organization',
      name: 'Amorely',
      url: SITE_ORIGIN + '/',
    },
  });

  scripts.push({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: landing.reviews.title,
    inLanguage: lang,
    itemListElement: REVIEW_IDS.map((id, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: landing.reviews.items[id].name,
        },
        reviewBody: landing.reviews.items[id].quote,
        image: `${SITE_ORIGIN}/landing/reviews/${id}.jpg`,
        itemReviewed: {
          '@type': 'WebApplication',
          name: 'Amorely',
          url: pageUrl,
        },
      },
    })),
  });

  scripts.push({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: FAQ_IDS.map((id) => ({
      '@type': 'Question',
      name: landing.faq.items[id].question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: landing.faq.items[id].answer,
      },
    })),
  });

  return scripts
    .map(
      (schema) => `    <script type="application/ld+json">
${indentJson(schema)}
    </script>`
    )
    .join('\n');
};

const buildLocaleHeadMeta = (lang, landing) => {
  const e = escapeHtml;
  const pageUrl = `${SITE_ORIGIN}/${lang}`;
  const ogAlternates = LOCALES.filter((code) => code !== lang)
    .map(
      (code) =>
        `    <meta property="og:locale:alternate" content="${OG_LOCALES[code]}" />`
    )
    .join('\n');

  return `    <title>${e(landing.documentTitle)}</title>
    <meta
      name="description"
      content="${e(landing.documentDescription)}"
    />
    <meta
      name="keywords"
      content="${e(landing.documentKeywords)}"
    />
    <meta name="author" content="Amorely" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${pageUrl}" />
${hreflangLinksHtml()}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Amorely" />
    <meta property="og:locale" content="${OG_LOCALES[lang]}" />
${ogAlternates}
    <meta property="og:title" content="${e(landing.ogTitle)}" />
    <meta
      property="og:description"
      content="${e(landing.ogDescription)}"
    />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:image" content="${SITE_ORIGIN}/logo512.png" />
    <meta property="og:image:alt" content="Amorely logo" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(landing.ogTitle)}" />
    <meta
      name="twitter:description"
      content="${e(landing.ogDescription)}"
    />
    <meta name="twitter:image" content="${SITE_ORIGIN}/logo512.png" />`;
};

const buildRootIndexHtml = (byLocale) => {
  const en = byLocale.en;
  const e = escapeHtml;

  const languageLinks = LOCALES.map(
    (lang) =>
      `            <li lang="${lang}"><a href="/${lang}">${e(byLocale[lang].documentTitle)}</a></li>`
  ).join('\n');

  // Full English landing on `/` (x-default) so Ctrl+U matches /ru /pt richness;
  // localized URLs remain the per-language canonicals.
  const enLandingBlock = renderLanguageBlock('en', en);
  const enJsonLd = buildLocaleJsonLd('en', en, byLocale, `${SITE_ORIGIN}/`);
  const ogAlternates = LOCALES.filter((code) => code !== 'en')
    .map(
      (code) =>
        `    <meta property="og:locale:alternate" content="${OG_LOCALES[code]}" />`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/png" sizes="32x32" href="%PUBLIC_URL%/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="%PUBLIC_URL%/favicon-16.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="%PUBLIC_URL%/apple-touch-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-visual" />
    <meta name="theme-color" content="#ff4b8d" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Amorely" />
    <!--! SEO_META_START -->
    <title>${e(en.documentTitle)}</title>
    <meta
      name="description"
      content="${e(en.documentDescription)}"
    />
    <meta
      name="keywords"
      content="${e(en.documentKeywords)}"
    />
    <meta name="author" content="Amorely" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${SITE_ORIGIN}/" />
${hreflangLinksHtml()}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Amorely" />
    <meta property="og:locale" content="${OG_LOCALES.en}" />
${ogAlternates}
    <meta property="og:title" content="${e(en.ogTitle)}" />
    <meta
      property="og:description"
      content="${e(en.ogDescription)}"
    />
    <meta property="og:url" content="${SITE_ORIGIN}/" />
    <meta property="og:image" content="${SITE_ORIGIN}/logo512.png" />
    <meta property="og:image:alt" content="Amorely logo" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(en.ogTitle)}" />
    <meta
      name="twitter:description"
      content="${e(en.ogDescription)}"
    />
    <meta name="twitter:image" content="${SITE_ORIGIN}/logo512.png" />
    <!--! SEO_META_END -->
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <link rel="preconnect" href="https://res.cloudinary.com" />
    <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/inter-cyrillic.woff2" as="font" type="font/woff2" crossorigin />
    <!--! SEO_JSONLD_START -->
${enJsonLd}
    <!--! SEO_JSONLD_END -->
    <script type="text/javascript">
      // GitHub Pages: восстановление маршрута после 404.html
      (function (l) {
        if (l.search[1] === '/') {
          var decoded = l.search
            .slice(1)
            .split('&')
            .map(function (s) {
              return s.replace(/~and~/g, '&');
            })
            .join('?');
          window.history.replaceState(
            null,
            null,
            l.pathname.slice(0, -1) + decoded + l.hash
          );
        }
      })(window.location);
    </script>
    <style>
      #root > .seo-bootstrap {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <noscript>
      <div style="max-width:40rem;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.5">
${enLandingBlock}
        <nav aria-label="Amorely languages">
          <ul>
${languageLinks}
          </ul>
        </nav>
      </div>
    </noscript>
    <!--
      Root = English x-default landing + language switcher.
      Guests are redirected by React to /{locale}; crawlers still see full EN SEO here.
      Per-locale pages: public/{lang}/index.html (dev) and build/{lang}/ (postbuild).
    -->
    <div id="root">
      <!--! SEO_BOOTSTRAP_START -->
      <main class="seo-bootstrap">
${enLandingBlock}
        <nav aria-label="Amorely languages">
          <ul>
${languageLinks}
          </ul>
        </nav>
      </main>
      <!--! SEO_BOOTSTRAP_END -->
    </div>
  </body>
</html>
`;
};

const buildPublicLocaleIndexHtml = (lang, landing, byLocale) => {
  const e = escapeHtml;
  const metaHtml = buildLocaleHeadMeta(lang, landing);
  const jsonLdHtml = buildLocaleJsonLd(lang, landing, byLocale);
  const bootstrapHtml = renderLanguageBlock(lang, landing);

  return `<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-visual" />
    <meta name="theme-color" content="#ff4b8d" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Amorely" />
    <!--! SEO_META_START -->
${metaHtml}
    <!--! SEO_META_END -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="preconnect" href="https://res.cloudinary.com" />
    <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/inter-cyrillic.woff2" as="font" type="font/woff2" crossorigin />
    <!--! SEO_JSONLD_START -->
${jsonLdHtml}
    <!--! SEO_JSONLD_END -->
    <script type="text/javascript">
      // GitHub Pages: восстановление маршрута после 404.html
      (function (l) {
        if (l.search[1] === '/') {
          var decoded = l.search
            .slice(1)
            .split('&')
            .map(function (s) {
              return s.replace(/~and~/g, '&');
            })
            .join('?');
          window.history.replaceState(
            null,
            null,
            l.pathname.slice(0, -1) + decoded + l.hash
          );
        }
      })(window.location);
    </script>
    <style>
      #root > .seo-bootstrap {
        display: none !important;
      }
    </style>
    <!-- CRA dev bundle; production postbuild replaces this file with hashed assets -->
    <script defer src="/static/js/bundle.js"></script>
  </head>
  <body>
    <noscript>
      <div style="max-width:40rem;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.5">
        <h1>Amorely</h1>
        <p lang="${lang}">${e(landing.documentDescription)}</p>
        <p><a href="/${lang}#auth-section">${e(landing.ctaRegister)}</a></p>
      </div>
    </noscript>
    <!--
      Locale landing HTML for Ctrl+U / crawlers (dev: public/{lang}/; prod: postbuild).
    -->
    <div id="root">
      <!--! SEO_BOOTSTRAP_START -->
      <main class="seo-bootstrap">
${bootstrapHtml}
      </main>
      <!--! SEO_BOOTSTRAP_END -->
    </div>
  </body>
</html>
`;
};

const byLocale = loadLandingByLocale();
const rootHtml = buildRootIndexHtml(byLocale);
fs.writeFileSync(indexPath, rootHtml, 'utf8');

const payloads = {};
for (const lang of LOCALES) {
  const landing = byLocale[lang];
  const bootstrapInner = renderLanguageBlock(lang, landing);
  payloads[lang] = {
    htmlLang: lang,
    metaHtml: buildLocaleHeadMeta(lang, landing),
    jsonLdHtml: buildLocaleJsonLd(lang, landing, byLocale),
    bootstrapHtml: `      <main class="seo-bootstrap">
${bootstrapInner}
      </main>`,
  };

  const localeDir = path.join(clientRoot, 'public', lang);
  fs.mkdirSync(localeDir, { recursive: true });
  fs.writeFileSync(
    path.join(localeDir, 'index.html'),
    buildPublicLocaleIndexHtml(lang, landing, byLocale),
    'utf8'
  );
}
fs.writeFileSync(payloadsPath, JSON.stringify(payloads, null, 2), 'utf8');

console.log(
  `Updated root ${path.relative(clientRoot, indexPath)}, public/{lang}/index.html, payloads for: ${LOCALES.join(', ')}`
);

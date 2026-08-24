/**
 * Generates:
 * 1) public/{terms,privacy,offer,payment,support,blog}/index.html
 *    and public/blog/{slug}/index.html — GH Pages + Ctrl+U in dev
 * 2) scripts/seo-public-payloads.json — per-page SEO for postbuild inject
 * 3) public/sitemap.xml — landing locales + public pages
 *
 * Usage: node --experimental-strip-types scripts/generate-public-seo.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BLOG_POSTS } from '../src/legal/blogPosts.ts';
import { OFFER_CONTENT } from '../src/legal/offerContent.ts';
import { PAYMENT_CONTENT } from '../src/legal/paymentContent.ts';
import { PRIVACY_CONTENT } from '../src/legal/privacyContent.ts';
import { TERMS_CONTENT } from '../src/legal/termsContent.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, '..');
const localesDir = path.join(clientRoot, 'src', 'locales');
const publicDir = path.join(clientRoot, 'public');
const payloadsPath = path.join(__dirname, 'seo-public-payloads.json');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

const SITE_ORIGIN = 'https://amorely.love';
// Keep in sync with client/src/legal/publicSite.ts (cannot import it from Node ESM).
const SUPPORT_EMAIL = 'amorely013@gmail.com';
const LEGAL_UPDATED_AT = '2026-08-24';
const LANDING_LOCALES = ['en', 'ru', 'uk', 'by', 'de', 'es', 'fr', 'pt'];
const DEFAULT_LANG = 'ru';
const OG_LOCALE = 'ru_RU';

const LEGAL_DOCS = {
  terms: TERMS_CONTENT,
  privacy: PRIVACY_CONTENT,
  offer: OFFER_CONTENT,
  payment: PAYMENT_CONTENT,
};

const organization = {
  '@type': 'Organization',
  name: 'Amorely',
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/logo512.png`,
  email: SUPPORT_EMAIL,
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

const pageUrl = (pathname) => `${SITE_ORIGIN}${pathname}`;

const landingOgImageUrl = (fileName) =>
  `${SITE_ORIGIN}/landing/${encodeURIComponent(fileName)}`;

const indentJson = (value, spaces = 6) => {
  const pad = ' '.repeat(spaces);
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((line) => `${pad}${line}`)
    .join('\n');
};

const jsonLdHtml = (blocks) =>
  blocks
    .map(
      (schema) => `    <script type="application/ld+json" data-amorely-public-jsonld="true">
${indentJson(schema)}
    </script>`
    )
    .join('\n');

const buildWebPageJsonLd = ({ pathname, title, description, type = 'WebPage' }) => ({
  '@context': 'https://schema.org',
  '@type': type,
  name: title,
  description,
  url: pageUrl(pathname),
  inLanguage: DEFAULT_LANG,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Amorely',
    url: `${SITE_ORIGIN}/`,
  },
  publisher: organization,
});

const buildLegalArticleJsonLd = ({ pathname, title, description, document }) => ({
  ...buildWebPageJsonLd({ pathname, title, description }),
  dateModified: LEGAL_UPDATED_AT,
  mainEntity: {
    '@type': 'DigitalDocument',
    name: title,
    text: [document.intro, ...document.sections.flatMap((section) => section.paragraphs)].join(
      '\n\n'
    ),
  },
});

const buildBreadcrumbJsonLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: pageUrl(item.path),
  })),
});

const buildBlogPostingJsonLd = (post, imageUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title.ru,
  description: post.excerpt.ru,
  datePublished: post.publishedAt,
  dateModified: post.publishedAt,
  image: imageUrl,
  inLanguage: DEFAULT_LANG,
  url: pageUrl(`/blog/${post.slug}`),
  author: organization,
  publisher: organization,
  articleBody: post.paragraphs.ru.join('\n\n'),
  mainEntityOfPage: pageUrl(`/blog/${post.slug}`),
});

const buildHeadMeta = ({ title, description, keywords, pathname, ogType, ogImage }) => {
  const e = escapeHtml;
  const url = pageUrl(pathname);
  const image = ogImage ?? {
    url: `${SITE_ORIGIN}/logo512.png`,
    alt: 'Amorely logo',
    width: 512,
    height: 512,
  };
  const imageSize =
    image.width && image.height
      ? `
    <meta property="og:image:width" content="${image.width}" />
    <meta property="og:image:height" content="${image.height}" />`
      : '';

  return `    <title>${e(title)}</title>
    <meta
      name="description"
      content="${e(description)}"
    />
    <meta
      name="keywords"
      content="${e(keywords)}"
    />
    <meta name="author" content="Amorely" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:site_name" content="Amorely" />
    <meta property="og:locale" content="${OG_LOCALE}" />
    <meta property="og:title" content="${e(title)}" />
    <meta
      property="og:description"
      content="${e(description)}"
    />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${e(image.url)}" />
    <meta property="og:image:alt" content="${e(image.alt)}" />${imageSize}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(title)}" />
    <meta
      name="twitter:description"
      content="${e(description)}"
    />
    <meta name="twitter:image" content="${e(image.url)}" />`;
};

const renderLegalBlock = (lang, title, document) => {
  const e = escapeHtml;
  const sections = document.sections
    .map(
      (section) => `            <section>
              <h2>${e(section.title)}</h2>
${section.paragraphs.map((paragraph) => `              <p>${e(paragraph)}</p>`).join('\n')}
            </section>`
    )
    .join('\n');

  return `        <article lang="${lang}">
          <h1>${e(title)}</h1>
          <p>${e(document.intro)}</p>
${sections}
        </article>`;
};

const renderSupportBlock = (lang, legal) => {
  const e = escapeHtml;
  return `        <section lang="${lang}">
          <h1>${e(legal.support.title)}</h1>
          <p>${e(legal.support.subtitle)}</p>
          <p>${e(legal.support.orWrite)} <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
        </section>`;
};

const renderBlogIndexBlock = (lang, legal, posts) => {
  const e = escapeHtml;
  const articles = posts
    .map(
      (post) => `          <article>
            <h2><a href="/blog/${e(post.slug)}">${e(post.title[lang])}</a></h2>
            <p>${e(post.excerpt[lang])}</p>
          </article>`
    )
    .join('\n');

  return `        <section lang="${lang}">
          <h1>${e(legal.blog.title)}</h1>
          <p>${e(legal.blog.lead)}</p>
${articles}
        </section>`;
};

const renderBlogPostBlock = (lang, post) => {
  const e = escapeHtml;
  const imageUrl = landingOgImageUrl(post.imageFile);
  const paragraphs = post.paragraphs[lang]
    .map((paragraph) => `          <p>${e(paragraph)}</p>`)
    .join('\n');

  return `        <article lang="${lang}">
          <h1>${e(post.title[lang])}</h1>
          <img src="${e(imageUrl)}" alt="${e(post.title[lang])}" />
${paragraphs}
        </article>`;
};

const wrapBootstrap = (inner) => `      <main class="seo-bootstrap">
${inner}
      </main>`;

const GH_PAGES_RESTORE = `    <script type="text/javascript">
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
    </script>`;

const buildPublicPageHtml = ({ htmlLang, metaHtml, jsonLd, bootstrapHtml }) => `<!DOCTYPE html>
<html lang="${htmlLang}">
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
${jsonLd}
    <!--! SEO_JSONLD_END -->
${GH_PAGES_RESTORE}
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
${bootstrapHtml.replace(/^      <main class="seo-bootstrap">\n/, '').replace(/\n      <\/main>$/, '')}
      </div>
    </noscript>
    <div id="root">
      <!--! SEO_BOOTSTRAP_START -->
${bootstrapHtml}
      <!--! SEO_BOOTSTRAP_END -->
    </div>
  </body>
</html>
`;

const buildLandingHreflangXml = () =>
  [
    ...LANDING_LOCALES.map(
      (lang) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_ORIGIN}/${lang}" />`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/" />`,
  ].join('\n');

const sitemapUrl = ({ loc, lastmod, changefreq, priority, extra = '' }) => {
  const lastmodXml = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>
    <loc>${loc}</loc>${lastmodXml}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${extra}
  </url>`;
};

const buildSitemapXml = (publicEntries) => {
  const hreflang = `\n${buildLandingHreflangXml()}`;
  const landingEntries = [
    sitemapUrl({
      loc: `${SITE_ORIGIN}/`,
      changefreq: 'weekly',
      priority: '1.0',
    }),
    ...LANDING_LOCALES.map((lang) =>
      sitemapUrl({
        loc: `${SITE_ORIGIN}/${lang}`,
        changefreq: 'weekly',
        priority: '0.9',
        extra: hreflang,
      })
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${landingEntries.join('\n')}
${publicEntries
  .map((entry) =>
    sitemapUrl({
      loc: pageUrl(entry.pathname),
      lastmod: entry.lastmod,
      changefreq: entry.changefreq,
      priority: entry.priority,
    })
  )
  .join('\n')}
</urlset>
`;
};

const ru = readLocaleJson('ru').legal;
const en = readLocaleJson('en').legal;
if (!ru?.pages?.terms?.keywords || !en?.pages?.terms?.keywords) {
  throw new Error('Missing legal.*.keywords in ru.json / en.json');
}

const pages = [];

for (const id of Object.keys(LEGAL_DOCS)) {
  const pathname = `/${id}`;
  const title = ru.pages[id].title;
  const description = ru.pages[id].description;
  const keywords = ru.pages[id].keywords;
  const documentRu = LEGAL_DOCS[id].ru;
  const documentEn = LEGAL_DOCS[id].en;
  const bootstrapHtml = wrapBootstrap(
    `${renderLegalBlock('ru', ru.pages[id].title, documentRu)}\n${renderLegalBlock(
      'en',
      en.pages[id].title,
      documentEn
    )}`
  );

  pages.push({
    id,
    pathname,
    htmlLang: DEFAULT_LANG,
    metaHtml: buildHeadMeta({
      title,
      description,
      keywords,
      pathname,
      ogType: 'website',
    }),
    jsonLdHtml: jsonLdHtml([
      buildLegalArticleJsonLd({
        pathname,
        title,
        description,
        document: documentRu,
      }),
    ]),
    bootstrapHtml,
    lastmod: LEGAL_UPDATED_AT,
    changefreq: 'monthly',
    priority: id === 'payment' ? '0.3' : id === 'offer' ? '0.4' : '0.5',
  });
}

pages.push({
  id: 'support',
  pathname: '/support',
  htmlLang: DEFAULT_LANG,
  metaHtml: buildHeadMeta({
    title: ru.support.documentTitle,
    description: ru.support.documentDescription,
    keywords: ru.support.keywords,
    pathname: '/support',
    ogType: 'website',
  }),
  jsonLdHtml: jsonLdHtml([
    buildWebPageJsonLd({
      pathname: '/support',
      title: ru.support.documentTitle,
      description: ru.support.documentDescription,
      type: 'ContactPage',
    }),
  ]),
  bootstrapHtml: wrapBootstrap(
    `${renderSupportBlock('ru', ru)}\n${renderSupportBlock('en', en)}`
  ),
  lastmod: LEGAL_UPDATED_AT,
  changefreq: 'monthly',
  priority: '0.5',
});

const blogPostsNewestFirst = [...BLOG_POSTS].sort((a, b) =>
  a.publishedAt < b.publishedAt ? 1 : -1
);
const latestBlogDate = blogPostsNewestFirst[0]?.publishedAt ?? LEGAL_UPDATED_AT;

pages.push({
  id: 'blog',
  pathname: '/blog',
  htmlLang: DEFAULT_LANG,
  metaHtml: buildHeadMeta({
    title: ru.blog.documentTitle,
    description: ru.blog.documentDescription,
    keywords: ru.blog.keywords,
    pathname: '/blog',
    ogType: 'website',
  }),
  jsonLdHtml: jsonLdHtml([
    buildWebPageJsonLd({
      pathname: '/blog',
      title: ru.blog.documentTitle,
      description: ru.blog.documentDescription,
      type: 'Blog',
    }),
    buildBreadcrumbJsonLd([
      { name: ru.blog.home, path: '/' },
      { name: ru.blog.title, path: '/blog' },
    ]),
  ]),
  bootstrapHtml: wrapBootstrap(
    `${renderBlogIndexBlock('ru', ru, blogPostsNewestFirst)}\n${renderBlogIndexBlock(
      'en',
      en,
      blogPostsNewestFirst
    )}`
  ),
  lastmod: latestBlogDate,
  changefreq: 'weekly',
  priority: '0.7',
});

for (const post of blogPostsNewestFirst) {
  const pathname = `/blog/${post.slug}`;
  const imageUrl = landingOgImageUrl(post.imageFile);
  pages.push({
    id: `blog/${post.slug}`,
    pathname,
    htmlLang: DEFAULT_LANG,
    metaHtml: buildHeadMeta({
      title: post.title.ru,
      description: post.excerpt.ru,
      keywords: ru.blog.keywords,
      pathname,
      ogType: 'article',
      ogImage: { url: imageUrl, alt: post.title.ru },
    }),
    jsonLdHtml: jsonLdHtml([
      buildBlogPostingJsonLd(post, imageUrl),
      buildBreadcrumbJsonLd([
        { name: ru.blog.home, path: '/' },
        { name: ru.blog.title, path: '/blog' },
        { name: post.title.ru, path: pathname },
      ]),
    ]),
    bootstrapHtml: wrapBootstrap(
      `${renderBlogPostBlock('ru', post)}\n${renderBlogPostBlock('en', post)}`
    ),
    lastmod: post.publishedAt,
    changefreq: 'monthly',
    priority: '0.6',
  });
}

const payloads = {};
for (const page of pages) {
  payloads[page.id] = {
    htmlLang: page.htmlLang,
    metaHtml: page.metaHtml,
    jsonLdHtml: page.jsonLdHtml,
    bootstrapHtml: page.bootstrapHtml,
  };

  const outDir = path.join(publicDir, ...page.id.split('/'));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'index.html'),
    buildPublicPageHtml({
      htmlLang: page.htmlLang,
      metaHtml: page.metaHtml,
      jsonLd: page.jsonLdHtml,
      bootstrapHtml: page.bootstrapHtml,
    }),
    'utf8'
  );
}

fs.writeFileSync(payloadsPath, JSON.stringify(payloads, null, 2), 'utf8');
fs.writeFileSync(
  sitemapPath,
  buildSitemapXml(
    pages.map((page) => ({
      pathname: page.pathname,
      lastmod: page.lastmod,
      changefreq: page.changefreq,
      priority: page.priority,
    }))
  ),
  'utf8'
);

console.log(
  `Updated public SEO pages (${pages.map((page) => page.id).join(', ')}), sitemap, and ${path.relative(
    clientRoot,
    payloadsPath
  )}`
);

import { SITE_ORIGIN } from '../localization/landingLocale';
import { SUPPORT_EMAIL } from './publicSite';
import type { LegalDocument } from './legalLocale';
import type { BlogPost } from './blogPosts';

export const getPublicAbsoluteUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
};

const organization = {
  '@type': 'Organization',
  name: 'Amorely',
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/logo512.png`,
  email: SUPPORT_EMAIL,
};

export const buildWebPageJsonLd = (input: {
  path: string;
  title: string;
  description: string;
  locale: string;
  type?: 'WebPage' | 'ContactPage' | 'Blog';
}): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': input.type ?? 'WebPage',
  name: input.title,
  description: input.description,
  url: getPublicAbsoluteUrl(input.path),
  inLanguage: input.locale,
  isPartOf: {
    '@type': 'WebSite',
    name: 'Amorely',
    url: `${SITE_ORIGIN}/`,
  },
  publisher: organization,
});

export const buildLegalArticleJsonLd = (input: {
  path: string;
  title: string;
  description: string;
  locale: string;
  dateModified: string;
  document: LegalDocument;
}): Record<string, unknown> => ({
  ...buildWebPageJsonLd(input),
  dateModified: input.dateModified,
  mainEntity: {
    '@type': 'DigitalDocument',
    name: input.title,
    text: [input.document.intro, ...input.document.sections.flatMap((section) => section.paragraphs)].join(
      '\n\n'
    ),
  },
});

export const buildBreadcrumbJsonLd = (
  items: Array<{ name: string; path: string }>
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: getPublicAbsoluteUrl(item.path),
  })),
});

export const buildBlogPostingJsonLd = (input: {
  post: BlogPost;
  locale: 'ru' | 'en';
  imageUrl: string;
}): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: input.post.title[input.locale],
  description: input.post.excerpt[input.locale],
  datePublished: input.post.publishedAt,
  dateModified: input.post.publishedAt,
  image: input.imageUrl,
  inLanguage: input.locale,
  url: getPublicAbsoluteUrl(`/blog/${input.post.slug}`),
  author: organization,
  publisher: organization,
  articleBody: input.post.paragraphs[input.locale].join('\n\n'),
  mainEntityOfPage: getPublicAbsoluteUrl(`/blog/${input.post.slug}`),
});

export const getLandingOgImageUrl = (fileName: string): string =>
  `${SITE_ORIGIN}/landing/${encodeURIComponent(fileName)}`;

import { getLandingPath, resolvePreferredLandingLocale } from '../localization/landingLocale';

export const SUPPORT_EMAIL = 'amorely013@gmail.com';
export const SITE_HOST = 'amorely.love';
export const LEGAL_UPDATED_AT = '2026-08-24';

export const PUBLIC_PATHS = {
  terms: '/terms',
  privacy: '/privacy',
  offer: '/offer',
  payment: '/payment',
  support: '/support',
  blog: '/blog',
} as const;

export const getBlogPostPath = (slug: string): string => `${PUBLIC_PATHS.blog}/${slug}`;

export const getPublicHomePath = (isAuthenticated: boolean): string =>
  isAuthenticated ? '/' : getLandingPath(resolvePreferredLandingLocale());

export const getPublicSignInPath = (): string =>
  getLandingPath(resolvePreferredLandingLocale(), '#auth-section');

import { getLandingPath, resolvePreferredLandingLocale } from '../localization/landingLocale';

export const SUPPORT_EMAIL = 'amorely013@gmail.com';
export const SITE_HOST = 'amorely.love';
export const LEGAL_UPDATED_AT = '2026-08-24';

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/amorely.love',
  tiktok: 'https://www.tiktok.com/@amorely.love',
  youtube: 'https://youtu.be/pnCo-TeEztY',
} as const;

export const SOCIAL_SAME_AS = [
  SOCIAL_LINKS.instagram,
  SOCIAL_LINKS.tiktok,
  SOCIAL_LINKS.youtube,
] as const;

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

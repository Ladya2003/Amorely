import { AppLocale, DEFAULT_LOCALE, resolveLocale, SUPPORTED_LOCALES } from '../i18n/locales';

export const DEFAULT_BLOCK_REASONS: Record<AppLocale, string> = {
  ru: 'Ваш аккаунт заблокирован за нарушение правил сообщества.',
  en: 'Your account has been blocked for violating community rules.',
  es: 'Tu cuenta ha sido bloqueada por infringir las normas de la comunidad.',
  de: 'Ihr Konto wurde wegen Verstoßes gegen die Community-Regeln gesperrt.',
  fr: 'Votre compte a été bloqué pour violation des règles de la communauté.',
  pt: 'Sua conta foi bloqueada por violar as regras da comunidade.',
  uk: 'Ваш обліковий запис заблоковано за порушення правил спільноти.',
};

export type BlockReasonsMap = Partial<Record<AppLocale, string>>;

export const getLocalizedBlockReason = (user: {
  locale?: string | null;
  blockedReasons?: BlockReasonsMap;
}): string => {
  const locale = resolveLocale(user.locale);
  const custom = user.blockedReasons?.[locale]?.trim();
  if (custom) {
    return custom;
  }
  return DEFAULT_BLOCK_REASONS[locale] ?? DEFAULT_BLOCK_REASONS[DEFAULT_LOCALE];
};

export const buildBlockReasons = (input?: BlockReasonsMap): Record<AppLocale, string> => {
  const result = {} as Record<AppLocale, string>;
  for (const locale of SUPPORTED_LOCALES) {
    const custom = input?.[locale]?.trim();
    result[locale] = custom || DEFAULT_BLOCK_REASONS[locale];
  }
  return result;
};

export const ACCOUNT_BLOCKED_ERROR = 'ACCOUNT_BLOCKED';

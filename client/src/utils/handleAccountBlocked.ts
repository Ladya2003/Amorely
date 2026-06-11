import { AxiosError } from 'axios';
import { AppLocale, resolveAppLocale, SUPPORTED_LOCALES } from '../localization/locale';

export const ACCOUNT_BLOCKED_ERROR = 'ACCOUNT_BLOCKED';

export type BlockReasonsMap = Partial<Record<AppLocale, string>>;

export type AccountBlockedPayload = {
  blockReason?: string;
  blockedReasons?: BlockReasonsMap;
};

export const getAccountBlockedPayload = (error: unknown): AccountBlockedPayload | null => {
  const axiosError = error as AxiosError<{
    error?: string;
    blockReason?: string;
    blockedReasons?: BlockReasonsMap;
  }>;

  if (
    axiosError?.response?.status === 403 &&
    axiosError.response.data?.error === ACCOUNT_BLOCKED_ERROR
  ) {
    return {
      blockReason: axiosError.response.data.blockReason,
      blockedReasons: axiosError.response.data.blockedReasons,
    };
  }

  return null;
};

export const getAccountBlockedReason = (error: unknown): string | null => {
  return getAccountBlockedPayload(error)?.blockReason || null;
};

export const resolveBlockReasonForLocale = (
  blockedReasons: BlockReasonsMap | null | undefined,
  locale: AppLocale,
  fallbackReason?: string | null
): string | null => {
  const localized = blockedReasons?.[locale]?.trim();
  if (localized) {
    return localized;
  }

  if (fallbackReason?.trim()) {
    return fallbackReason.trim();
  }

  for (const supportedLocale of SUPPORTED_LOCALES) {
    const value = blockedReasons?.[supportedLocale]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
};

export const resolveBlockReasonFromError = (
  error: unknown,
  locale: string | null | undefined
): string | null => {
  const payload = getAccountBlockedPayload(error);
  if (!payload) {
    return null;
  }

  return resolveBlockReasonForLocale(
    payload.blockedReasons,
    resolveAppLocale(locale),
    payload.blockReason
  );
};

import axios from 'axios';
import { API_URL } from '../config';
import { setAppLocale } from './index';
import { AppLocale, resolveAppLocale } from './locale';

export const getStoredAppLocale = (): AppLocale | null => {
  const stored = localStorage.getItem('locale');
  if (!stored) {
    return null;
  }
  return resolveAppLocale(stored);
};

export const resolvePreferredLocale = (profileLocale?: string | null): AppLocale =>
  getStoredAppLocale() ?? resolveAppLocale(profileLocale);

export const syncUserLocaleToServer = async (
  userId: string,
  token: string,
  locale: AppLocale
): Promise<void> => {
  await axios.put(
    `${API_URL}/api/settings/theme`,
    { userId, locale },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const applyPreferredLocale = async (
  profileLocale: string | undefined,
  options?: { userId?: string; token?: string }
): Promise<AppLocale> => {
  const preferredLocale = resolvePreferredLocale(profileLocale);
  setAppLocale(preferredLocale);

  if (
    options?.userId &&
    options?.token &&
    resolveAppLocale(profileLocale) !== preferredLocale
  ) {
    try {
      await syncUserLocaleToServer(options.userId, options.token, preferredLocale);
    } catch (error) {
      console.error('Failed to sync locale to server:', error);
    }
  }

  return preferredLocale;
};

export const persistAppLocale = async (
  locale: AppLocale,
  options?: { userId?: string; token?: string }
): Promise<AppLocale> => {
  setAppLocale(locale);

  if (options?.userId && options?.token) {
    try {
      await syncUserLocaleToServer(options.userId, options.token, locale);
    } catch (error) {
      console.error('Failed to sync locale to server:', error);
    }
  }

  return locale;
};

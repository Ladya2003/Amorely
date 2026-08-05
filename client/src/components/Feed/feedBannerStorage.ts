export const LOCALE_BANNER_DISMISSED_KEY = 'locale-banner-dismissed';
export const LOCALE_BANNER_DISMISSED_AT_KEY = 'locale-banner-dismissed-at';
export const INSTALL_BANNER_DISMISSED_KEY = 'install-banner-dismissed';
export const INSTALL_BANNER_DELAY_MS = 5 * 60 * 1000;

/** Локальные хелперы оставлены для одноразовой миграции dismiss-флагов в аккаунт. */
export const isLocalLocaleBannerDismissed = () =>
  localStorage.getItem(LOCALE_BANNER_DISMISSED_KEY) === 'true';

export const getLocalLocaleBannerDismissedAt = (): number | null => {
  if (!isLocalLocaleBannerDismissed()) {
    return null;
  }
  const dismissedAt = localStorage.getItem(LOCALE_BANNER_DISMISSED_AT_KEY);
  return dismissedAt ? Number(dismissedAt) : 0;
};

export const isLocalInstallBannerDismissed = () =>
  localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === 'true';

export const clearLocalBannerDismissals = () => {
  localStorage.removeItem(LOCALE_BANNER_DISMISSED_KEY);
  localStorage.removeItem(LOCALE_BANNER_DISMISSED_AT_KEY);
  localStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
};

export const isAppInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export type AccountBannerPrefs = {
  localeBannerDismissedAt?: string | Date | null;
  installBannerDismissed?: boolean;
};

export const isLocaleBannerDismissedOnAccount = (prefs: AccountBannerPrefs) =>
  Boolean(prefs.localeBannerDismissedAt);

export const canShowInstallBanner = (prefs: AccountBannerPrefs) => {
  if (prefs.installBannerDismissed || isAppInstalled()) {
    return false;
  }
  if (!prefs.localeBannerDismissedAt) {
    return false;
  }
  const dismissedAt = new Date(prefs.localeBannerDismissedAt).getTime();
  if (Number.isNaN(dismissedAt)) {
    return false;
  }
  return Date.now() - dismissedAt >= INSTALL_BANNER_DELAY_MS;
};

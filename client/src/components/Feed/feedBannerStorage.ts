export const LOCALE_BANNER_DISMISSED_KEY = 'locale-banner-dismissed';
export const LOCALE_BANNER_DISMISSED_AT_KEY = 'locale-banner-dismissed-at';
export const INSTALL_BANNER_DISMISSED_KEY = 'install-banner-dismissed';
export const INSTALL_BANNER_DELAY_MS = 5 * 60 * 1000;

export const markLocaleBannerDismissed = () => {
  localStorage.setItem(LOCALE_BANNER_DISMISSED_KEY, 'true');
  localStorage.setItem(LOCALE_BANNER_DISMISSED_AT_KEY, String(Date.now()));
};

export const isLocaleBannerDismissed = () =>
  localStorage.getItem(LOCALE_BANNER_DISMISSED_KEY) === 'true';

export const getLocaleBannerDismissedAt = (): number | null => {
  if (!isLocaleBannerDismissed()) {
    return null;
  }
  const dismissedAt = localStorage.getItem(LOCALE_BANNER_DISMISSED_AT_KEY);
  return dismissedAt ? Number(dismissedAt) : 0;
};

export const isInstallBannerDismissed = () =>
  localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === 'true';

export const markInstallBannerDismissed = () => {
  localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, 'true');
};

export const isAppInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

export const canShowInstallBanner = () => {
  if (isInstallBannerDismissed() || isAppInstalled()) {
    return false;
  }
  const dismissedAt = getLocaleBannerDismissedAt();
  if (dismissedAt === null) {
    return false;
  }
  return Date.now() - dismissedAt >= INSTALL_BANNER_DELAY_MS;
};

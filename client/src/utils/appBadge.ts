export const isAppBadgeSupported = (): boolean => 'setAppBadge' in navigator;

const syncBadgeViaServiceWorker = (count: number): void => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  void navigator.serviceWorker.ready.then((registration) => {
    registration.active?.postMessage({ type: 'SYNC_BADGE', count });
  });
};

export const syncAppBadge = async (count: number): Promise<void> => {
  syncBadgeViaServiceWorker(count);

  if (!isAppBadgeSupported()) {
    return;
  }

  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
  } catch (error) {
    console.error('Не удалось обновить badge на иконке:', error);
  }
};

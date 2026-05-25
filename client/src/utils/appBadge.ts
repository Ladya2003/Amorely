export const isAppBadgeSupported = (): boolean => 'setAppBadge' in navigator;

export const syncAppBadge = async (count: number): Promise<void> => {
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

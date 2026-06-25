/* eslint-disable no-restricted-globals */
const getScopeBase = () => {
  try {
    return new URL(self.registration.scope).pathname;
  } catch {
    return '/';
  }
};

const syncAppBadge = async (count) => {
  const nav = self.navigator;
  if (!('setAppBadge' in nav)) {
    return;
  }

  try {
    if (count > 0) {
      await nav.setAppBadge(count);
    } else {
      await nav.clearAppBadge();
    }
  } catch (error) {
    console.error('Failed to set app badge:', error);
  }
};

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.type === 'SYNC_BADGE' && typeof data.count === 'number') {
    event.waitUntil(syncAppBadge(data.count));
  }
});

const createCircularIcon = async (imageUrl) => {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch avatar');
  }

  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const size = 192;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas is unavailable');
  }

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const minSide = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - minSide) / 2;
  const sy = (bitmap.height - minSide) / 2;
  ctx.drawImage(bitmap, sx, sy, minSide, minSide, 0, 0, size, size);
  bitmap.close();

  const resultBlob = await canvas.convertToBlob({ type: 'image/png' });
  return URL.createObjectURL(resultBlob);
};

const resolveNotificationIcon = async (payload, scopeBase) => {
  const defaultIcon = `${scopeBase}logo192.png`;
  const avatarUrl = payload.icon?.trim();

  if (!avatarUrl) {
    return defaultIcon;
  }

  try {
    return await createCircularIcon(avatarUrl);
  } catch (error) {
    console.error('Failed to create circular avatar icon:', error);
    return avatarUrl;
  }
};

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const scopeBase = getScopeBase();
  const badge = payload.badge || `${scopeBase}favicon-32.png`;
  const url = payload.url || `${scopeBase}chat`;
  const badgeCount = typeof payload.badgeCount === 'number' ? payload.badgeCount : null;
  // На iOS бейдж нужно обновлять сразу при push, не дожидаясь async-обработки иконки.
  const badgePromise = badgeCount !== null ? syncAppBadge(badgeCount) : Promise.resolve();

  event.waitUntil(
    (async () => {
      const icon = await resolveNotificationIcon(payload, scopeBase);
      const options = {
        body: payload.body || 'Новое уведомление',
        icon,
        badge,
        tag: payload.tag,
        data: { url },
        renotify: true
      };

      await Promise.all([
        self.registration.showNotification(payload.title || 'Amorely', options),
        badgePromise
      ]);

      if (icon.startsWith('blob:')) {
        URL.revokeObjectURL(icon);
      }
    })()
  );
});

const toAppPath = (url) => {
  try {
    const parsed = new URL(url, self.location.origin);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url.startsWith('/') ? url : '/';
  }
};

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const appPath = toAppPath(targetUrl);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({ type: 'PUSH_NAVIGATE', url: appPath });
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(appPath).then(() => client.focus());
          }
          return client.focus();
        }
      }
      return clients.openWindow(appPath);
    })
  );
});

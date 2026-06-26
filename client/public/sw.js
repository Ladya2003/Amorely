/* eslint-disable no-restricted-globals */
const getScopeBase = () => {
  try {
    return new URL(self.registration.scope).pathname;
  } catch {
    return '/';
  }
};

const parseBadgeCount = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const parsePushPayload = (payload, scopeBase) => {
  if (payload?.web_push != null && payload?.notification) {
    const notification = payload.notification;
    return {
      title: notification.title || 'Amorely',
      body: notification.body || 'Новое уведомление',
      url: notification.navigate || `${scopeBase}chat`,
      tag: notification.tag,
      badgeCount: parseBadgeCount(notification.app_badge)
    };
  }

  return {
    title: payload.title || 'Amorely',
    body: payload.body || 'Новое уведомление',
    url: payload.url || `${scopeBase}chat`,
    tag: payload.tag,
    badgeCount: parseBadgeCount(payload.badgeCount)
  };
};

const syncAppBadge = async (count) => {
  if (!('setAppBadge' in self.navigator)) {
    return;
  }

  try {
    if (count > 0) {
      await self.navigator.setAppBadge(count);
    } else {
      await self.navigator.clearAppBadge();
    }
  } catch (error) {
    console.error('Failed to set app badge:', error);
  }
};

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.type === 'SYNC_BADGE' && typeof data.count === 'number') {
    event.waitUntil(syncAppBadge(data.count));
  }
});

self.addEventListener('push', (event) => {
  let rawPayload = {};
  try {
    rawPayload = event.data ? event.data.json() : {};
  } catch {
    rawPayload = { body: event.data?.text() };
  }

  const scopeBase = getScopeBase();
  const payload = parsePushPayload(rawPayload, scopeBase);
  const badge = rawPayload.badge || `${scopeBase}favicon-32.png`;

  const promises = [
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: `${scopeBase}logo192.png`,
      badge,
      tag: payload.tag,
      data: { url: payload.url },
      renotify: true
    })
  ];

  if (payload.badgeCount !== null) {
    promises.push(syncAppBadge(payload.badgeCount));
  }

  event.waitUntil(Promise.all(promises));
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

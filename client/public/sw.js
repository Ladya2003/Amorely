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

  const promises = [
    self.registration.showNotification(payload.title || 'Amorely', {
      body: payload.body || 'Новое уведомление',
      icon: `${scopeBase}logo192.png`,
      badge,
      tag: payload.tag,
      data: { url },
      renotify: true
    })
  ];

  if (badgeCount !== null && 'setAppBadge' in self.navigator) {
    promises.push(syncAppBadge(badgeCount));
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

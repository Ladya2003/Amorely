/* eslint-disable no-restricted-globals */
const getScopeBase = () => {
  try {
    return new URL(self.registration.scope).pathname;
  } catch {
    return '/';
  }
};

const syncAppBadge = async (count) => {
  if (!('setAppBadge' in navigator)) {
    return;
  }

  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
  } catch (error) {
    console.error('Failed to set app badge:', error);
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
  const icon = payload.icon || `${scopeBase}logo192.png`;
  const badge = payload.badge || `${scopeBase}favicon-32.png`;
  const url = payload.url || `${scopeBase}chat`;

  const options = {
    body: payload.body || 'Новое уведомление',
    icon,
    badge,
    tag: payload.tag,
    data: { url },
    renotify: true
  };

  const badgeCount = typeof payload.badgeCount === 'number' ? payload.badgeCount : null;

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || 'Amorely', options),
      badgeCount !== null ? syncAppBadge(badgeCount) : Promise.resolve()
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
          client.focus();
          return undefined;
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

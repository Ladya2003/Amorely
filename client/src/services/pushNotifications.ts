import axios from 'axios';
import { API_URL } from '../config';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isPushSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

const getServiceWorkerPath = () => {
  const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  return `${publicUrl}/sw.js`;
};

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(getServiceWorkerPath());
    return registration;
  } catch (error) {
    console.error('Не удалось зарегистрировать service worker:', error);
    return null;
  }
};

export const subscribeToPush = async (token: string): Promise<boolean> => {
  if (!isPushSupported()) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  const registration = (await navigator.serviceWorker.getRegistration(getServiceWorkerPath())) ||
    (await registerServiceWorker());

  if (!registration) {
    return false;
  }

  await navigator.serviceWorker.ready;

  const { data } = await axios.get(`${API_URL}/api/push/vapid-public-key`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const applicationServerKey = urlBase64ToUint8Array(data.publicKey);
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
  }

  await axios.post(
    `${API_URL}/api/push/subscribe`,
    { subscription: subscription.toJSON() },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return true;
};

export const unsubscribeFromPush = async (token: string) => {
  const registration = await navigator.serviceWorker.getRegistration(getServiceWorkerPath());
  const subscription = await registration?.pushManager.getSubscription();

  if (subscription) {
    await axios.delete(`${API_URL}/api/push/subscribe`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { endpoint: subscription.endpoint }
    });
    await subscription.unsubscribe();
  }
};

export const checkPushSubscriptionStatus = async (): Promise<{
  subscribed: boolean;
  permission: NotificationPermission | 'unsupported';
}> => {
  const permission = getNotificationPermission();
  if (!isPushSupported() || permission !== 'granted') {
    return { subscribed: false, permission };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(getServiceWorkerPath());
    const subscription = await registration?.pushManager.getSubscription();
    return { subscribed: !!subscription, permission };
  } catch (error) {
    console.error('Не удалось проверить push-подписку:', error);
    return { subscribed: false, permission };
  }
};

export const ensurePushSubscription = async (token: string, hasPushEnabled: boolean) => {
  if (!isPushSupported() || !hasPushEnabled) {
    return { subscribed: false, permission: getNotificationPermission() };
  }

  if (Notification.permission === 'denied') {
    return { subscribed: false, permission: 'denied' as const };
  }

  if (Notification.permission === 'granted') {
    const subscribed = await subscribeToPush(token);
    return { subscribed, permission: 'granted' as const };
  }

  const subscribed = await subscribeToPush(token);
  return { subscribed, permission: Notification.permission };
};

export const hasAnyPushSettingEnabled = (settings?: {
  push?: {
    newContent?: boolean;
    messages?: boolean;
    events?: boolean;
    news?: boolean;
  };
}) => {
  const push = settings?.push;
  if (!push) {
    return false;
  }
  return Boolean(push.newContent || push.messages || push.events || push.news);
};

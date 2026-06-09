import webpush from 'web-push';
import PushSubscription from '../models/pushSubscription';
import User, { UserDocument } from '../models/user';
import Message from '../models/message';

let vapidConfigured = false;

const configureVapid = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@amorely.app';

  if (!publicKey || !privateKey) {
    return false;
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }

  return true;
};

export const isPushConfigured = () => configureVapid();

export const getVapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  badgeCount?: number;
}

export const getTotalUnreadCount = async (userId: string) =>
  Message.countDocuments({
    receiverId: userId,
    isRead: false
  });

export const sendPushToUser = async (userId: string, payload: PushPayload) => {
  if (!configureVapid()) {
    return;
  }

  const subscriptions = await PushSubscription.find({ userId });
  if (!subscriptions.length) {
    return;
  }

  const notificationPayload = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          notificationPayload
        );
      } catch (error: any) {
        const statusCode = error?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id });
        } else {
          console.error('Ошибка отправки push-уведомления:', error);
        }
      }
    })
  );
};

const getUserDisplayName = (user: UserDocument) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username;
};

const truncatePreview = (value: string, maxLength = 120) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const getMessagePreview = (params: {
  text: string;
  pushPreview?: string;
  hasEncryptedPayload: boolean;
  hasAttachments: boolean;
  sharedEvent?: { title?: string };
  sharedNote?: { title?: string };
  forwardFrom?: { text?: string };
}) => {
  const pushPreview = params.pushPreview?.trim();
  if (pushPreview) {
    return truncatePreview(pushPreview);
  }

  const trimmed = params.text.trim();
  if (trimmed) {
    return truncatePreview(trimmed);
  }

  if (params.sharedEvent?.title?.trim()) {
    return truncatePreview(`Событие: ${params.sharedEvent.title.trim()}`);
  }

  if (params.sharedNote?.title?.trim()) {
    return truncatePreview(`Заметка: ${params.sharedNote.title.trim()}`);
  }

  const forwardText = params.forwardFrom?.text?.trim();
  if (forwardText) {
    return truncatePreview(forwardText);
  }

  if (params.hasAttachments) {
    return params.hasEncryptedPayload ? 'Зашифрованное медиа' : 'Отправлено вложение';
  }

  if (params.hasEncryptedPayload) {
    return 'Зашифрованное сообщение';
  }

  return 'Новое сообщение';
};

export const notifyNewMessage = async (params: {
  receiverId: string;
  senderId: string;
  text: string;
  pushPreview?: string;
  encryptedPayload?: unknown;
  attachments?: unknown[];
  sharedEvent?: { title?: string };
  sharedNote?: { title?: string };
  forwardFrom?: { text?: string };
  chatUrl?: string;
}) => {
  const receiver = await User.findById(params.receiverId);
  if (!receiver?.notificationSettings?.push?.messages) {
    return;
  }

  const sender = await User.findById(params.senderId);
  if (!sender) {
    return;
  }

  const senderName = getUserDisplayName(sender);
  const body = getMessagePreview({
    text: params.text,
    pushPreview: params.pushPreview,
    hasEncryptedPayload: Boolean(params.encryptedPayload),
    hasAttachments: Boolean(params.attachments?.length),
    sharedEvent: params.sharedEvent,
    sharedNote: params.sharedNote,
    forwardFrom: params.forwardFrom,
  });

  const badgeCount = await getTotalUnreadCount(params.receiverId);

  await sendPushToUser(params.receiverId, {
    title: senderName,
    body,
    url: params.chatUrl || '/chat',
    tag: `chat-${params.senderId}`,
    badgeCount
  });
};

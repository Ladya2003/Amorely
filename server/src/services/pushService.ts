import webpush from 'web-push';
import PushSubscription from '../models/pushSubscription';
import User, { UserDocument } from '../models/user';

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
}

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

const getMessagePreview = (text: string, hasEncryptedPayload: boolean, hasAttachments: boolean) => {
  if (hasEncryptedPayload) {
    return 'Новое сообщение';
  }
  if (hasAttachments && !text.trim()) {
    return 'Отправлено вложение';
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return 'Новое сообщение';
  }
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
};

export const notifyNewMessage = async (params: {
  receiverId: string;
  senderId: string;
  text: string;
  encryptedPayload?: unknown;
  attachments?: unknown[];
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
  const body = getMessagePreview(
    params.text,
    Boolean(params.encryptedPayload),
    Boolean(params.attachments?.length)
  );

  await sendPushToUser(params.receiverId, {
    title: senderName,
    body,
    url: params.chatUrl || '/chat',
    tag: `chat-${params.senderId}`
  });
};

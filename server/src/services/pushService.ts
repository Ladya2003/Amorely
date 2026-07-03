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

const buildWirePayload = (payload: PushPayload): { body: string; contentType: string } => {
  const hasBadge = typeof payload.badgeCount === 'number';
  const hasNavigate = Boolean(payload.url?.trim());

  // Declarative Web Push (iOS 18.4+): бейдж на иконке выставляется системой через app_badge.
  if (hasBadge && hasNavigate) {
    const notification: Record<string, string | number> = {
      title: payload.title,
      body: payload.body,
      navigate: payload.url!.trim(),
      app_badge: payload.badgeCount!
    };
    if (payload.tag) {
      notification.tag = payload.tag;
    }

    return {
      body: JSON.stringify({ web_push: 8030, notification }),
      contentType: 'application/notification+json'
    };
  }

  return {
    body: JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
      tag: payload.tag,
      badgeCount: payload.badgeCount
    }),
    contentType: 'application/json'
  };
};

export const sendPushToUser = async (userId: string, payload: PushPayload) => {
  if (!configureVapid()) {
    return;
  }

  const subscriptions = await PushSubscription.find({ userId });
  if (!subscriptions.length) {
    return;
  }

  const { body, contentType } = buildWirePayload(payload);

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys
          },
          body,
          { headers: { 'Content-Type': contentType } }
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

export const getTotalUnreadCount = async (userId: string) =>
  Message.countDocuments({
    receiverId: userId,
    isRead: false
  });

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
  sharedGame?: { title?: string };
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

  if (params.sharedGame?.title?.trim()) {
    return truncatePreview(`Игра: ${params.sharedGame.title.trim()}`);
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

const buildAppUrl = (path: string) => {
  const appBasePath = (process.env.APP_BASE_PATH || '').replace(/\/$/, '');
  const clientUrl = (process.env.CLIENT_URL || '').replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullPath = `${appBasePath}${normalizedPath}`;
  return clientUrl ? `${clientUrl}${fullPath}` : fullPath;
};

const buildChatUrl = (senderId: string) =>
  buildAppUrl(`/chat?contact=${encodeURIComponent(senderId)}`);

export const buildGamePlayUrl = (gameId: string) =>
  buildAppUrl(`/chat/games/${encodeURIComponent(gameId)}/play`);

const buildFeedContentUrl = (contentId?: string) => {
  const query = contentId ? `?content=${encodeURIComponent(contentId)}` : '';
  return buildAppUrl(`/${query}`);
};

const buildNewsUrl = (newsId: string) =>
  buildAppUrl(`/news?article=${encodeURIComponent(newsId)}`);

const getPartnerContentBody = (itemsCount: number) => {
  if (itemsCount > 1) {
    return `Добавлено ${itemsCount} новых фото или видео`;
  }
  return 'Добавлено новое фото или видео';
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
  sharedGame?: { title?: string };
  forwardFrom?: { text?: string };
  chatUrl?: string;
}) => {
  const receiver = await User.findById(params.receiverId);
  if (!receiver?.notificationSettings?.push?.messages) {
    return;
  }

  const sender = await User.findById(params.senderId).select('username firstName lastName');
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
    sharedGame: params.sharedGame,
    forwardFrom: params.forwardFrom,
  });

  const badgeCount = await getTotalUnreadCount(params.receiverId);

  await sendPushToUser(params.receiverId, {
    title: senderName,
    body,
    url: params.chatUrl || buildChatUrl(params.senderId),
    tag: `chat-${params.senderId}`,
    badgeCount
  });
};

export const notifyNewPartnerContent = async (params: {
  receiverId: string;
  senderId: string;
  itemsCount?: number;
  contentId?: string;
}) => {
  const receiver = await User.findById(params.receiverId);
  if (!receiver?.notificationSettings?.push?.newContent) {
    return;
  }

  const sender = await User.findById(params.senderId);
  if (!sender) {
    return;
  }

  const senderName = getUserDisplayName(sender);
  const itemsCount = params.itemsCount ?? 1;

  await sendPushToUser(params.receiverId, {
    title: senderName,
    body: getPartnerContentBody(itemsCount),
    url: buildFeedContentUrl(params.contentId),
    tag: 'partner-content'
  });
};

const buildAdminUrl = () => buildAppUrl('/admin');

export const notifyNewReport = async (params: {
  reportId: string;
  reporterId: string;
  reportedUserId: string;
  text: string;
}) => {
  const admins = await User.find({
    role: 'admin',
    'notificationSettings.push.reports': { $ne: false },
  }).select('_id');

  if (!admins.length) {
    return;
  }

  const [reporter, reportedUser] = await Promise.all([
    User.findById(params.reporterId).select('username firstName lastName'),
    User.findById(params.reportedUserId).select('username firstName lastName'),
  ]);

  const reporterName = reporter ? getUserDisplayName(reporter) : 'Пользователь';
  const reportedName = reportedUser ? getUserDisplayName(reportedUser) : 'Пользователь';
  const preview = params.text.trim() || 'Новая жалоба';
  const body = truncatePreview(`${reporterName} → ${reportedName}: ${preview}`);

  await Promise.all(
    admins.map((admin) =>
      sendPushToUser(admin._id.toString(), {
        title: 'Новая жалоба',
        body,
        url: buildAdminUrl(),
        tag: `report-${params.reportId}`,
      })
    )
  );
};

export const notifyNewsPublished = async (params: {
  newsId: string;
  title: string;
}) => {
  const users = await User.find({
    'notificationSettings.push.news': true
  }).select('_id');

  if (!users.length) {
    return;
  }

  const body = truncatePreview(params.title.trim() || 'Новая новость');

  await Promise.all(
    users.map((user) =>
      sendPushToUser(user._id.toString(), {
        title: 'Amorely',
        body,
        url: buildNewsUrl(params.newsId),
        tag: `news-${params.newsId}`
      })
    )
  );
};

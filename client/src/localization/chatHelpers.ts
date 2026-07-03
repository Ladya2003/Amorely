import { format } from 'date-fns';
import type { TFunction } from 'i18next';
import { resolveAppLocale } from './locale';
import { LOCALE_BCP47 } from './localeFormat';
import { formatNumericDate, getDateFnsLocale } from './calendarHelpers';

type MessagePreviewSource = {
  text?: string;
  attachments?: Array<{ type?: string; encrypted?: boolean }>;
  forwardFrom?: { text?: string } | null;
  sharedEvent?: { title?: string } | null;
  sharedNote?: { title?: string } | null;
  sharedGame?: { title?: string } | null;
  encryptedPayload?: unknown;
  mediaEnvelopes?: unknown[];
};

export const getChatMessagePreview = (t: TFunction, message: MessagePreviewSource): string => {
  const hasMedia = Boolean(message.attachments && message.attachments.length > 0);
  const hasEncryptedMedia = Boolean(
    message.attachments?.some((attachment) => attachment.encrypted || attachment.type === 'encrypted')
  );
  const hasDecryptedMedia = Boolean(message.mediaEnvelopes && message.mediaEnvelopes.length > 0);

  if (message.text?.trim()) {
    return message.text;
  }

  if (hasDecryptedMedia || (hasMedia && !message.encryptedPayload)) {
    return t('chat.message.media');
  }

  if (!message.text && message.forwardFrom) {
    return t('chat.message.forwarded');
  }

  if (!message.text && message.sharedEvent) {
    return t('chat.message.event', { title: message.sharedEvent.title });
  }

  if (!message.text && message.sharedNote) {
    return t('chat.message.note', { title: message.sharedNote.title });
  }

  if (!message.text && message.sharedGame) {
    return t('chat.message.game', { title: message.sharedGame.title });
  }

  if (message.encryptedPayload && hasEncryptedMedia) {
    return t('chat.message.encryptedMedia');
  }

  if (message.encryptedPayload) {
    return t('chat.message.encrypted');
  }

  if (hasMedia) {
    return t('chat.message.media');
  }

  return message.text || '';
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isYesterday = (date: Date, now: Date) => {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

const capitalizePresenceLabel = (value: string): string => {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const formatChatContactPresence = (
  t: TFunction,
  isOnline: boolean | undefined,
  lastSeen: string | null | undefined,
  locale?: string | null
): string => {
  if (isOnline) {
    return capitalizePresenceLabel(t('chat.presence.online'));
  }

  if (!lastSeen) {
    return capitalizePresenceLabel(t('chat.presence.offline'));
  }

  const lastSeenDate = new Date(lastSeen);
  if (Number.isNaN(lastSeenDate.getTime())) {
    return capitalizePresenceLabel(t('chat.presence.offline'));
  }

  const appLocale = resolveAppLocale(locale ?? undefined);
  const bcp47 = LOCALE_BCP47[appLocale];
  const now = new Date();
  const time = lastSeenDate.toLocaleTimeString(bcp47, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isSameDay(lastSeenDate, now)) {
    return capitalizePresenceLabel(t('chat.presence.lastSeenToday', { time }));
  }

  if (isYesterday(lastSeenDate, now)) {
    return capitalizePresenceLabel(t('chat.presence.lastSeenYesterday', { time }));
  }

  const date = formatNumericDate(lastSeenDate, locale);

  return capitalizePresenceLabel(t('chat.presence.lastSeenDate', { date, time }));
};

export const formatChatDayBadge = (date: Date, locale?: string | null): string =>
  format(date, 'd MMMM', { locale: getDateFnsLocale(locale) });

export const formatChatListTimestamp = (timestamp: string, locale?: string | null): string => {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const appLocale = resolveAppLocale(locale ?? undefined);
  const bcp47 = LOCALE_BCP47[appLocale];

  if (isSameDay(messageDate, now)) {
    return messageDate.toLocaleTimeString(bcp47, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return formatNumericDate(messageDate, locale);
};

export const formatChatBirthday = (birthday: string | null | undefined, locale?: string | null): string | null => {
  if (!birthday) return null;

  const date = new Date(birthday);
  if (Number.isNaN(date.getTime())) return null;

  return format(date, 'd MMMM', { locale: getDateFnsLocale(locale) });
};

export const getChatPlaceholderBio = (t: TFunction, name: string, seed: string): string => {
  const safeName = name.trim() || t('chat.profile.defaultName');
  const keys = [
    'chat.profile.placeholderBio1',
    'chat.profile.placeholderBio2',
    'chat.profile.placeholderBio3',
    'chat.profile.placeholderBio4',
    'chat.profile.placeholderBio5',
  ];

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index) * (index + 1)) % keys.length;
  }

  return t(keys[hash], { name: safeName });
};

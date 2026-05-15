import {
  decryptChatText,
  decryptChatTextAsSender,
  encryptChatText,
  type LocalDeviceKeys
} from './cryptoService';

export type EncryptedTextPayload = {
  ciphertext: string;
  iv: string;
};

export type ContentMediaEnvelope = {
  mediaKey: string;
  iv: string;
  mimeType: string;
  displayType?: 'image' | 'video';
};

export type RawContentFields = {
  encrypted?: boolean;
  title?: string;
  description?: string;
  encryptedTitle?: EncryptedTextPayload;
  encryptedDescription?: EncryptedTextPayload;
  metadataSenderId?: string;
  metadataRecipientId?: string;
  targetId?: string;
  userId?: string | { _id?: string };
  createdBy?: string | { _id?: string };
};

export type DecryptedContentFields = {
  title?: string;
  description?: string;
};

export const normalizeUserId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]') return null;
    return trimmed;
  }
  if (typeof value === 'object' && value !== null) {
    if ('_id' in value && (value as { _id?: unknown })._id) {
      return String((value as { _id: unknown })._id);
    }
    if ('id' in value && (value as { id?: unknown }).id) {
      return String((value as { id: unknown }).id);
    }
  }
  return null;
};

const isEncryptedContent = (item: RawContentFields): boolean =>
  Boolean(item.encrypted || item.encryptedTitle?.ciphertext);

const resolveSenderId = (item: RawContentFields): string | null =>
  normalizeUserId(item.metadataSenderId) ||
  normalizeUserId(item.createdBy) ||
  normalizeUserId(item.userId) ||
  null;

const resolveRecipientId = (
  item: RawContentFields,
  fallbackPartnerId?: string,
  viewerId?: string
): string | null => {
  const meta = normalizeUserId(item.metadataRecipientId);
  const target = normalizeUserId(item.targetId);
  const partner = normalizeUserId(fallbackPartnerId);

  if (meta && (!viewerId || meta !== viewerId)) return meta;
  if (target && (!viewerId || target !== viewerId)) return target;
  if (partner && (!viewerId || partner !== viewerId)) return partner;

  return meta || target || partner || null;
};

export const encryptTextForPartner = async (
  keys: LocalDeviceKeys,
  partnerUserId: string,
  plaintext: string
): Promise<EncryptedTextPayload> => {
  const encrypted = await encryptChatText(keys, partnerUserId, plaintext);
  return { ciphertext: encrypted.ciphertext, iv: encrypted.iv };
};

export const decryptTextFromSender = async (
  keys: LocalDeviceKeys,
  senderUserId: string,
  payload: EncryptedTextPayload
): Promise<string> => decryptChatText(keys, senderUserId, payload);

const decryptEncryptedText = async (
  keys: LocalDeviceKeys,
  item: RawContentFields,
  payload: EncryptedTextPayload,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<string> => {
  const viewerId = normalizeUserId(currentUserId);
  const senderId = resolveSenderId(item);
  const recipientId = resolveRecipientId(item, fallbackPartnerId, viewerId || undefined);

  if (viewerId && senderId && viewerId === senderId) {
    if (!recipientId) {
      throw new Error('Не удалось определить получателя шифрования');
    }
    return decryptChatTextAsSender(keys, recipientId, payload);
  }

  if (!senderId) {
    throw new Error('Не удалось определить отправителя');
  }

  return decryptTextFromSender(keys, senderId, payload);
};

export const decryptContentFields = async (
  keys: LocalDeviceKeys,
  item: RawContentFields,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<DecryptedContentFields> => {
  if (!isEncryptedContent(item)) {
    return { title: item.title, description: item.description };
  }

  const result: DecryptedContentFields = {};

  if (item.encryptedTitle?.ciphertext) {
    try {
      result.title = await decryptEncryptedText(
        keys,
        item,
        item.encryptedTitle,
        currentUserId,
        fallbackPartnerId
      );
    } catch (error) {
      console.error('Не удалось расшифровать заголовок:', error);
      result.title = 'Не удалось расшифровать';
    }
  }

  if (item.encryptedDescription?.ciphertext) {
    try {
      result.description = await decryptEncryptedText(
        keys,
        item,
        item.encryptedDescription,
        currentUserId,
        fallbackPartnerId
      );
    } catch (error) {
      console.error('Не удалось расшифровать описание:', error);
      result.description = '';
    }
  }

  return result;
};

export const decryptContentFieldsList = async <T extends RawContentFields>(
  keys: LocalDeviceKeys,
  items: T[],
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<Array<T & DecryptedContentFields>> =>
  Promise.all(
    items.map(async (item) => ({
      ...item,
      ...(await decryptContentFields(keys, item, currentUserId, fallbackPartnerId))
    }))
  );

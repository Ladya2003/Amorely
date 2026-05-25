import {
  decryptChatTextWithFallback,
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

export type MediaEnvelopeMeta = {
  mimeType?: string;
  displayType?: 'image' | 'video';
  mediaKey?: string;
  iv?: string;
};

export type RawContentFields = {
  encrypted?: boolean;
  title?: string;
  description?: string;
  encryptedTitle?: EncryptedTextPayload;
  encryptedDescription?: EncryptedTextPayload;
  encryptedMediaEnvelope?: EncryptedTextPayload;
  mediaEnvelope?: MediaEnvelopeMeta;
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

export type SharedEventMediaContext = {
  previewEncrypted?: boolean;
  previewMediaEnvelope?: ContentMediaEnvelope;
  previewEncryptedMediaEnvelope?: EncryptedTextPayload;
  previewMetadataSenderId?: string;
  previewMetadataRecipientId?: string;
};

export type SharedEventMediaItemContext = SharedEventMediaContext & {
  id?: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  encryptedMediaEnvelope?: EncryptedTextPayload;
  previewMediaEnvelope?: ContentMediaEnvelope;
};

const serializeMediaSecrets = (mediaKey: string, iv: string): string =>
  JSON.stringify({ mediaKey, iv });

const parseMediaSecrets = (plaintext: string): Pick<ContentMediaEnvelope, 'mediaKey' | 'iv'> => {
  const parsed = JSON.parse(plaintext) as { mediaKey?: string; iv?: string };
  if (!parsed.mediaKey || !parsed.iv) {
    throw new Error('Некорректный envelope медиа');
  }
  return { mediaKey: parsed.mediaKey, iv: parsed.iv };
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

export const encryptMediaEnvelopeForPartner = async (
  keys: LocalDeviceKeys,
  partnerUserId: string,
  secrets: Pick<ContentMediaEnvelope, 'mediaKey' | 'iv'>
): Promise<EncryptedTextPayload> =>
  encryptTextForPartner(keys, partnerUserId, serializeMediaSecrets(secrets.mediaKey, secrets.iv));

export const decryptTextFromSender = async (
  keys: LocalDeviceKeys,
  senderUserId: string,
  payload: EncryptedTextPayload
): Promise<string> =>
  decryptChatTextWithFallback(keys, senderUserId, payload, { isOwnMessage: false });

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
    return decryptChatTextWithFallback(keys, recipientId, payload, { isOwnMessage: true });
  }

  if (!senderId) {
    throw new Error('Не удалось определить отправителя');
  }

  return decryptTextFromSender(keys, senderId, payload);
};

export const decryptContentMediaEnvelope = async (
  keys: LocalDeviceKeys,
  item: RawContentFields,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<ContentMediaEnvelope | undefined> => {
  const meta = item.mediaEnvelope;
  if (meta?.mediaKey && meta?.iv) {
    return {
      mediaKey: meta.mediaKey,
      iv: meta.iv,
      mimeType: meta.mimeType || 'application/octet-stream',
      displayType: meta.displayType
    };
  }

  if (!item.encryptedMediaEnvelope?.ciphertext) {
    return undefined;
  }

  const plaintext = await decryptEncryptedText(
    keys,
    item,
    item.encryptedMediaEnvelope,
    currentUserId,
    fallbackPartnerId
  );
  const secrets = parseMediaSecrets(plaintext);

  return {
    mediaKey: secrets.mediaKey,
    iv: secrets.iv,
    mimeType: meta?.mimeType || 'application/octet-stream',
    displayType: meta?.displayType
  };
};

export const decryptSharedEventPreviewEnvelope = async (
  keys: LocalDeviceKeys,
  sharedEvent: SharedEventMediaContext,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<ContentMediaEnvelope | undefined> => {
  if (sharedEvent.previewMediaEnvelope?.mediaKey && sharedEvent.previewMediaEnvelope?.iv) {
    return sharedEvent.previewMediaEnvelope;
  }

  if (!sharedEvent.previewEncryptedMediaEnvelope?.ciphertext) {
    return undefined;
  }

  return decryptContentMediaEnvelope(
    keys,
    {
      encrypted: sharedEvent.previewEncrypted,
      encryptedMediaEnvelope: sharedEvent.previewEncryptedMediaEnvelope,
      mediaEnvelope: sharedEvent.previewMediaEnvelope,
      metadataSenderId: sharedEvent.previewMetadataSenderId,
      metadataRecipientId: sharedEvent.previewMetadataRecipientId
    },
    currentUserId,
    fallbackPartnerId
  );
};

export const decryptSharedEventMediaItem = async (
  keys: LocalDeviceKeys,
  item: SharedEventMediaItemContext,
  metadata: Pick<SharedEventMediaContext, 'previewMetadataSenderId' | 'previewMetadataRecipientId'>,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<ContentMediaEnvelope | undefined> => {
  if (item.previewMediaEnvelope?.mediaKey && item.previewMediaEnvelope?.iv) {
    return item.previewMediaEnvelope;
  }

  const encryptedMediaEnvelope = item.encryptedMediaEnvelope;
  if (!encryptedMediaEnvelope?.ciphertext) {
    return undefined;
  }

  return decryptContentMediaEnvelope(
    keys,
    {
      encrypted: item.encrypted,
      encryptedMediaEnvelope,
      mediaEnvelope: item.previewMediaEnvelope,
      metadataSenderId: metadata.previewMetadataSenderId,
      metadataRecipientId: metadata.previewMetadataRecipientId
    },
    currentUserId,
    fallbackPartnerId
  );
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

export const enrichItemWithDecryptedMedia = async <T extends RawContentFields>(
  keys: LocalDeviceKeys,
  item: T,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<T & { mediaEnvelope?: ContentMediaEnvelope }> => {
  const needsMediaDecrypt = Boolean(
    item.encryptedMediaEnvelope?.ciphertext || item.mediaEnvelope?.mediaKey
  );
  if (!needsMediaDecrypt) {
    return item as T & { mediaEnvelope?: ContentMediaEnvelope };
  }

  try {
    const mediaEnvelope = await decryptContentMediaEnvelope(
      keys,
      item,
      currentUserId,
      fallbackPartnerId
    );
    if (!mediaEnvelope) {
      return item as T & { mediaEnvelope?: ContentMediaEnvelope };
    }
    return { ...item, mediaEnvelope };
  } catch (error) {
    console.error('Не удалось расшифровать медиа:', error);
    return item as T & { mediaEnvelope?: ContentMediaEnvelope };
  }
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

export const decryptContentItemsWithMedia = async <T extends RawContentFields>(
  keys: LocalDeviceKeys,
  items: T[],
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<Array<T & DecryptedContentFields & { mediaEnvelope?: ContentMediaEnvelope }>> =>
  Promise.all(
    items.map(async (item) => {
      const textFields = await decryptContentFields(keys, item, currentUserId, fallbackPartnerId);
      const withMedia = await enrichItemWithDecryptedMedia(
        keys,
        { ...item, ...textFields },
        currentUserId,
        fallbackPartnerId
      );
      return { ...withMedia, ...textFields };
    })
  );

export const decryptCalendarEventsWithMedia = async <
  T extends RawContentFields & { media?: RawContentFields[] }
>(
  keys: LocalDeviceKeys,
  events: T[],
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<Array<T & DecryptedContentFields>> =>
  Promise.all(
    events.map(async (event) => {
      const textFields = await decryptContentFields(keys, event, currentUserId, fallbackPartnerId);
      const media = event.media
        ? await Promise.all(
            event.media.map(async (mediaItem) => {
              const mediaContext: RawContentFields = {
                ...mediaItem,
                encrypted: mediaItem.encrypted ?? event.encrypted,
                metadataSenderId:
                  mediaItem.metadataSenderId || event.metadataSenderId || normalizeUserId(event.userId) || undefined,
                metadataRecipientId:
                  mediaItem.metadataRecipientId || event.metadataRecipientId || undefined,
                userId: mediaItem.userId || event.userId,
                createdBy: mediaItem.createdBy || event.createdBy
              };
              return enrichItemWithDecryptedMedia(keys, mediaContext, currentUserId, fallbackPartnerId);
            })
          )
        : event.media;

      return {
        ...event,
        ...textFields,
        media
      };
    })
  );

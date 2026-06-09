import i18n from '../localization';
import {
  decryptChatTextWithFallback,
  encryptChatText,
  type LocalDeviceKeys
} from './cryptoService';

const CONTENT_CRYPTO_OPTIONS = { allowCacheBust: false as const };

type DecryptionContext = {
  payload: EncryptedTextPayload;
  asOwn: boolean;
  peerId: string;
  alternatePeerId?: string;
};

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

export type DualEncryptedTextPayload = {
  self: EncryptedTextPayload;
  partner?: EncryptedTextPayload;
};

export type RawContentFields = {
  encrypted?: boolean;
  title?: string;
  description?: string;
  encryptedTitle?: EncryptedTextPayload;
  encryptedDescription?: EncryptedTextPayload;
  encryptedTitlePartner?: EncryptedTextPayload;
  encryptedDescriptionPartner?: EncryptedTextPayload;
  encryptedMediaEnvelope?: EncryptedTextPayload;
  encryptedMediaEnvelopePartner?: EncryptedTextPayload;
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

export type RawPlanNoteFields = {
  encrypted?: boolean;
  title?: string;
  content?: string;
  category?: string;
  encryptedTitle?: EncryptedTextPayload;
  encryptedTitlePartner?: EncryptedTextPayload;
  encryptedContent?: EncryptedTextPayload;
  encryptedContentPartner?: EncryptedTextPayload;
  encryptedCategory?: EncryptedTextPayload;
  encryptedCategoryPartner?: EncryptedTextPayload;
  metadataSenderId?: string;
  metadataRecipientId?: string;
  createdBy?: string | { _id?: string };
  userId?: string | { _id?: string };
  media?: RawContentFields[];
};

export type DecryptedPlanNoteFields = {
  title: string;
  content: string;
  category: string;
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
  Boolean(
    item.encrypted ||
      item.encryptedTitle?.ciphertext ||
      item.encryptedTitlePartner?.ciphertext
  );

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

  if (viewerId && meta === viewerId) return meta;
  if (viewerId && target === viewerId) return target;

  if (meta && (!viewerId || meta !== viewerId)) return meta;
  if (target && (!viewerId || target !== viewerId)) return target;
  if (partner && (!viewerId || partner !== viewerId)) return partner;

  return meta || target || partner || null;
};

type TextFieldName = 'Title' | 'Description';

const getTextFieldPayloads = (item: RawContentFields, field: TextFieldName) => {
  if (field === 'Title') {
    return {
      self: item.encryptedTitle,
      partner: item.encryptedTitlePartner
    };
  }
  return {
    self: item.encryptedDescription,
    partner: item.encryptedDescriptionPartner
  };
};

const pickTextDecryptionContext = (
  item: RawContentFields,
  field: TextFieldName,
  currentUserId?: string,
  fallbackPartnerId?: string
): DecryptionContext | null => {
  const viewerId = normalizeUserId(currentUserId);
  const authorId = resolveSenderId(item);
  const { self: selfPayload, partner: partnerPayload } = getTextFieldPayloads(item, field);
  const storedRecipientId =
    normalizeUserId(item.metadataRecipientId) || normalizeUserId(item.targetId);
  const activePartnerId = normalizeUserId(fallbackPartnerId);

  if (!viewerId || !authorId) {
    return null;
  }

  if (viewerId === authorId) {
    if (!selfPayload) {
      return null;
    }

    if (partnerPayload) {
      return {
        payload: selfPayload,
        asOwn: true,
        peerId: viewerId,
        alternatePeerId:
          storedRecipientId && storedRecipientId !== viewerId ? storedRecipientId : undefined
      };
    }

    return {
      payload: selfPayload,
      asOwn: true,
      peerId: storedRecipientId || viewerId
    };
  }

  if (partnerPayload && activePartnerId && viewerId === activePartnerId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (partnerPayload && storedRecipientId === viewerId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (partnerPayload && viewerId !== authorId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (selfPayload && !partnerPayload && storedRecipientId === viewerId) {
    return { payload: selfPayload, asOwn: false, peerId: authorId };
  }

  return null;
};

const pickMediaDecryptionContext = (
  item: RawContentFields,
  currentUserId?: string,
  fallbackPartnerId?: string
): DecryptionContext | null => {
  const viewerId = normalizeUserId(currentUserId);
  const authorId = resolveSenderId(item);
  const selfPayload = item.encryptedMediaEnvelope;
  const partnerPayload = item.encryptedMediaEnvelopePartner;
  const storedRecipientId =
    normalizeUserId(item.metadataRecipientId) || normalizeUserId(item.targetId);
  const activePartnerId = normalizeUserId(fallbackPartnerId);

  if (!viewerId || !authorId) {
    return null;
  }

  if (viewerId === authorId) {
    if (!selfPayload) {
      return null;
    }

    if (partnerPayload) {
      return {
        payload: selfPayload,
        asOwn: true,
        peerId: viewerId,
        alternatePeerId:
          storedRecipientId && storedRecipientId !== viewerId ? storedRecipientId : undefined
      };
    }

    return {
      payload: selfPayload,
      asOwn: true,
      peerId: storedRecipientId || viewerId
    };
  }

  if (partnerPayload && activePartnerId && viewerId === activePartnerId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (partnerPayload && storedRecipientId === viewerId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (partnerPayload && viewerId !== authorId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (selfPayload && !partnerPayload && storedRecipientId === viewerId) {
    return { payload: selfPayload, asOwn: false, peerId: authorId };
  }

  return null;
};

const decryptWithContext = async (
  keys: LocalDeviceKeys,
  item: RawContentFields,
  context: DecryptionContext,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<string> => {
  try {
    return await decryptEncryptedText(
      keys,
      item,
      context.payload,
      currentUserId,
      fallbackPartnerId,
      { asOwn: context.asOwn, peerId: context.peerId }
    );
  } catch (firstError) {
    if (
      !context.asOwn ||
      !context.alternatePeerId ||
      context.alternatePeerId === context.peerId
    ) {
      throw firstError;
    }

    return decryptEncryptedText(
      keys,
      item,
      context.payload,
      currentUserId,
      fallbackPartnerId,
      { asOwn: true, peerId: context.alternatePeerId }
    );
  }
};

export const encryptDualTextForContent = async (
  keys: LocalDeviceKeys,
  selfUserId: string,
  partnerUserId: string | undefined,
  plaintext: string,
  options?: { bypassCache?: boolean }
): Promise<DualEncryptedTextPayload> => {
  const self = await encryptTextForPartner(keys, selfUserId, plaintext, options);
  if (!partnerUserId || partnerUserId === selfUserId) {
    return { self };
  }
  const partner = await encryptTextForPartner(keys, partnerUserId, plaintext, options);
  return { self, partner };
};

export const encryptDualMediaEnvelopeForContent = async (
  keys: LocalDeviceKeys,
  selfUserId: string,
  partnerUserId: string | undefined,
  secrets: Pick<ContentMediaEnvelope, 'mediaKey' | 'iv'>,
  options?: { bypassCache?: boolean }
): Promise<DualEncryptedTextPayload> => {
  const serialized = serializeMediaSecrets(secrets.mediaKey, secrets.iv);
  const self = await encryptTextForPartner(keys, selfUserId, serialized, options);
  if (!partnerUserId || partnerUserId === selfUserId) {
    return { self };
  }
  const partner = await encryptTextForPartner(keys, partnerUserId, serialized, options);
  return { self, partner };
};

export const decryptOwnContentText = async (
  keys: LocalDeviceKeys,
  item: RawContentFields,
  field: TextFieldName,
  selfUserId: string
): Promise<string | undefined> => {
  const context = pickTextDecryptionContext(item, field, selfUserId, undefined);
  if (!context) {
    return undefined;
  }

  try {
    return await decryptWithContext(keys, item, context, selfUserId, undefined);
  } catch {
    return undefined;
  }
};
export const encryptTextForPartner = async (
  keys: LocalDeviceKeys,
  partnerUserId: string,
  plaintext: string,
  options?: { bypassCache?: boolean }
): Promise<EncryptedTextPayload> => {
  const encrypted = await encryptChatText(keys, partnerUserId, plaintext, options);
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
  decryptChatTextWithFallback(keys, senderUserId, payload, {
    isOwnMessage: false,
    ...CONTENT_CRYPTO_OPTIONS
  });

const decryptEncryptedText = async (
  keys: LocalDeviceKeys,
  item: RawContentFields,
  payload: EncryptedTextPayload,
  currentUserId?: string,
  fallbackPartnerId?: string,
  forcedContext?: { asOwn: boolean; peerId: string }
): Promise<string> => {
  const context =
    forcedContext ||
    (() => {
      const viewerId = normalizeUserId(currentUserId);
      const senderId = resolveSenderId(item);
      const recipientId = resolveRecipientId(item, fallbackPartnerId, viewerId || undefined);

      if (viewerId && senderId && viewerId === senderId) {
        if (!recipientId) {
          throw new Error('Не удалось определить получателя шифрования');
        }
        return { asOwn: true, peerId: recipientId };
      }

      if (!senderId) {
        throw new Error('Не удалось определить отправителя');
      }

      return { asOwn: false, peerId: senderId };
    })();

  if (context.asOwn) {
    return decryptChatTextWithFallback(keys, context.peerId, payload, {
      isOwnMessage: true,
      ...CONTENT_CRYPTO_OPTIONS
    });
  }

  return decryptTextFromSender(keys, context.peerId, payload);
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

  const context = pickMediaDecryptionContext(item, currentUserId, fallbackPartnerId);
  if (!context) {
    return undefined;
  }

  const plaintext = await decryptWithContext(
    keys,
    item,
    context,
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

  const titleContext = pickTextDecryptionContext(item, 'Title', currentUserId, fallbackPartnerId);
  if (titleContext) {
    try {
      result.title = await decryptWithContext(
        keys,
        item,
        titleContext,
        currentUserId,
        fallbackPartnerId
      );
    } catch {
      result.title = i18n.t('crypto.decryptFailed');
    }
  }

  const descriptionContext = pickTextDecryptionContext(
    item,
    'Description',
    currentUserId,
    fallbackPartnerId
  );
  if (descriptionContext) {
    try {
      result.description = await decryptWithContext(
        keys,
        item,
        descriptionContext,
        currentUserId,
        fallbackPartnerId
      );
    } catch {
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
  } catch {
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
                encryptedMediaEnvelopePartner: mediaItem.encryptedMediaEnvelopePartner,
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

type PlanNoteTextFieldName = 'Title' | 'Content' | 'Category';

const isEncryptedPlanNote = (item: RawPlanNoteFields): boolean =>
  Boolean(
    item.encrypted ||
      item.encryptedTitle?.ciphertext ||
      item.encryptedTitlePartner?.ciphertext
  );

const getPlanNoteFieldPayloads = (item: RawPlanNoteFields, field: PlanNoteTextFieldName) => {
  if (field === 'Title') {
    return { self: item.encryptedTitle, partner: item.encryptedTitlePartner };
  }
  if (field === 'Content') {
    return { self: item.encryptedContent, partner: item.encryptedContentPartner };
  }
  return { self: item.encryptedCategory, partner: item.encryptedCategoryPartner };
};

const pickPlanNoteFieldDecryptionContext = (
  item: RawPlanNoteFields,
  field: PlanNoteTextFieldName,
  currentUserId?: string,
  fallbackPartnerId?: string
): DecryptionContext | null => {
  const viewerId = normalizeUserId(currentUserId);
  const authorId = resolveSenderId(item);
  const { self: selfPayload, partner: partnerPayload } = getPlanNoteFieldPayloads(item, field);
  const storedRecipientId = normalizeUserId(item.metadataRecipientId);
  const activePartnerId = normalizeUserId(fallbackPartnerId);

  if (!viewerId || !authorId) {
    return null;
  }

  if (viewerId === authorId) {
    if (!selfPayload) {
      return null;
    }

    if (partnerPayload) {
      return {
        payload: selfPayload,
        asOwn: true,
        peerId: viewerId,
        alternatePeerId:
          storedRecipientId && storedRecipientId !== viewerId ? storedRecipientId : undefined
      };
    }

    return {
      payload: selfPayload,
      asOwn: true,
      peerId: storedRecipientId || viewerId
    };
  }

  if (partnerPayload && activePartnerId && viewerId === activePartnerId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (partnerPayload && storedRecipientId === viewerId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (partnerPayload && viewerId !== authorId) {
    return { payload: partnerPayload, asOwn: false, peerId: authorId };
  }

  if (selfPayload && !partnerPayload && storedRecipientId === viewerId) {
    return { payload: selfPayload, asOwn: false, peerId: authorId };
  }

  return null;
};

export const decryptPlanNoteFields = async (
  keys: LocalDeviceKeys,
  item: RawPlanNoteFields,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<DecryptedPlanNoteFields> => {
  if (!isEncryptedPlanNote(item)) {
    return {
      title: item.title || '',
      content: item.content || '',
      category: item.category || ''
    };
  }

  const result: DecryptedPlanNoteFields = {
    title: '',
    content: '',
    category: ''
  };

  const titleContext = pickPlanNoteFieldDecryptionContext(item, 'Title', currentUserId, fallbackPartnerId);
  if (titleContext) {
    try {
      result.title = await decryptWithContext(
        keys,
        item,
        titleContext,
        currentUserId,
        fallbackPartnerId
      );
    } catch {
      result.title = i18n.t('crypto.decryptFailed');
    }
  }

  const contentContext = pickPlanNoteFieldDecryptionContext(
    item,
    'Content',
    currentUserId,
    fallbackPartnerId
  );
  if (contentContext) {
    try {
      result.content = await decryptWithContext(
        keys,
        item,
        contentContext,
        currentUserId,
        fallbackPartnerId
      );
    } catch {
      result.content = '';
    }
  }

  const categoryContext = pickPlanNoteFieldDecryptionContext(
    item,
    'Category',
    currentUserId,
    fallbackPartnerId
  );
  if (categoryContext) {
    try {
      result.category = await decryptWithContext(
        keys,
        item,
        categoryContext,
        currentUserId,
        fallbackPartnerId
      );
    } catch {
      result.category = i18n.t('crypto.decryptFailed');
    }
  }

  return result;
};

export const decryptPlanNote = async <T extends RawPlanNoteFields>(
  keys: LocalDeviceKeys,
  note: T,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<T & DecryptedPlanNoteFields> => {
  const textFields = await decryptPlanNoteFields(keys, note, currentUserId, fallbackPartnerId);
  const media = note.media
    ? await Promise.all(
        note.media.map(async (mediaItem) => {
          const mediaContext: RawContentFields = {
            ...mediaItem,
            encrypted: mediaItem.encrypted ?? note.encrypted,
            encryptedMediaEnvelopePartner: mediaItem.encryptedMediaEnvelopePartner,
            metadataSenderId:
              mediaItem.metadataSenderId ||
              note.metadataSenderId ||
              normalizeUserId(note.createdBy) ||
              undefined,
            metadataRecipientId: mediaItem.metadataRecipientId || note.metadataRecipientId || undefined
          };
          return enrichItemWithDecryptedMedia(keys, mediaContext, currentUserId, fallbackPartnerId);
        })
      )
    : note.media;

  return {
    ...note,
    ...textFields,
    media
  };
};

export const decryptPlanNotesList = async <T extends RawPlanNoteFields>(
  keys: LocalDeviceKeys,
  notes: T[],
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<Array<T & DecryptedPlanNoteFields>> =>
  Promise.all(notes.map((note) => decryptPlanNote(keys, note, currentUserId, fallbackPartnerId)));

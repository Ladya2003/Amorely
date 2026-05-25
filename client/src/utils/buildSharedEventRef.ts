import type { SharedEventMediaRef, SharedEventRef } from '../components/Chat/ChatDialog';
import type { ContentMediaEnvelope } from '../crypto/contentCryptoService';
import { enrichItemWithDecryptedMedia } from '../crypto/contentCryptoService';
import type { LocalDeviceKeys } from '../crypto/cryptoService';

interface EventMediaFile {
  _id: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  encryptedMediaEnvelope?: { ciphertext: string; iv: string };
}

export interface EventLikeForShare {
  _id: string;
  eventId?: string;
  title?: string;
  description?: string;
  eventDate?: string;
  createdAt: string;
  metadataSenderId?: string;
  metadataRecipientId?: string;
  media?: EventMediaFile[];
}

const toLegacyPreviewEnvelope = (
  media?: EventMediaFile
): ContentMediaEnvelope | undefined => {
  if (!media?.mediaEnvelope?.mediaKey || !media.mediaEnvelope.iv) {
    return undefined;
  }
  return media.mediaEnvelope;
};

const mapMediaRef = (media: EventMediaFile): SharedEventMediaRef => {
  const plainEnvelope = toLegacyPreviewEnvelope(media);
  // Файл на CDN остаётся зашифрованным — ключи в previewMediaEnvelope, encrypted=true.
  const encrypted = plainEnvelope ? true : (media.encrypted ?? false);
  return {
    id: media._id,
    url: media.url,
    resourceType: media.resourceType,
    encrypted,
    previewMediaEnvelope: plainEnvelope,
    encryptedMediaEnvelope: plainEnvelope ? undefined : media.encryptedMediaEnvelope
  };
};

export const buildSharedEventRef = (event: EventLikeForShare): SharedEventRef => {
  const mediaItems = (event.media || []).filter((item) => item.url && item.url.trim().length > 0);
  const firstMedia = mediaItems[0];
  const firstPlainEnvelope = toLegacyPreviewEnvelope(firstMedia);

  return {
    eventId: event.eventId || event._id,
    title: event.title || 'Без названия',
    previewUrl: firstMedia?.url,
    previewResourceType: firstMedia?.resourceType,
    previewEncrypted: firstPlainEnvelope ? true : firstMedia?.encrypted,
    previewMediaEnvelope: firstPlainEnvelope,
    previewEncryptedMediaEnvelope: firstPlainEnvelope
      ? undefined
      : firstMedia?.encryptedMediaEnvelope,
    previewMetadataSenderId: event.metadataSenderId,
    previewMetadataRecipientId: event.metadataRecipientId,
    eventDate: event.eventDate || event.createdAt,
    media: mediaItems.map(mapMediaRef)
  };
};

export const prepareEventForShare = async (
  keys: LocalDeviceKeys,
  event: EventLikeForShare,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<SharedEventRef> => {
  if (!event.media?.length) {
    return buildSharedEventRef(event);
  }

  const media = await Promise.all(
    event.media.map(async (item) => {
      if (!item.url?.trim()) {
        return item;
      }

      const decrypted = await enrichItemWithDecryptedMedia(
        keys,
        {
          encrypted: item.encrypted ?? true,
          encryptedMediaEnvelope: item.encryptedMediaEnvelope,
          mediaEnvelope: item.mediaEnvelope,
          metadataSenderId: event.metadataSenderId,
          metadataRecipientId: event.metadataRecipientId
        },
        currentUserId,
        fallbackPartnerId
      );

      const mediaEnvelope = decrypted.mediaEnvelope ?? item.mediaEnvelope;
      const hasPlainEnvelope = Boolean(mediaEnvelope?.mediaKey && mediaEnvelope?.iv);

      return {
        ...item,
        mediaEnvelope,
        encryptedMediaEnvelope: hasPlainEnvelope ? undefined : item.encryptedMediaEnvelope
      };
    })
  );

  return buildSharedEventRef({ ...event, media });
};

import type { SharedNoteMediaRef, SharedNoteRef } from '../components/Chat/ChatDialog';
import type { ContentMediaEnvelope } from '../crypto/contentCryptoService';
import { enrichItemWithDecryptedMedia } from '../crypto/contentCryptoService';
import type { LocalDeviceKeys } from '../crypto/cryptoService';

interface NoteMediaFile {
  _id: string;
  url: string;
  resourceType: 'image' | 'video';
  encrypted?: boolean;
  mediaEnvelope?: ContentMediaEnvelope;
  encryptedMediaEnvelope?: { ciphertext: string; iv: string };
}

export interface NoteLikeForShare {
  _id: string;
  title?: string;
  content?: string;
  category?: string;
  updatedAt: string;
  metadataSenderId?: string;
  metadataRecipientId?: string;
  media?: NoteMediaFile[];
}

const toLegacyPreviewEnvelope = (
  media?: NoteMediaFile
): ContentMediaEnvelope | undefined => {
  if (!media?.mediaEnvelope?.mediaKey || !media.mediaEnvelope.iv) {
    return undefined;
  }
  return media.mediaEnvelope;
};

const mapMediaRef = (media: NoteMediaFile): SharedNoteMediaRef => {
  const plainEnvelope = toLegacyPreviewEnvelope(media);
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

export const buildSharedNoteRef = (note: NoteLikeForShare): SharedNoteRef => {
  const mediaItems = (note.media || []).filter((item) => item.url && item.url.trim().length > 0);
  const firstMedia = mediaItems[0];
  const firstPlainEnvelope = toLegacyPreviewEnvelope(firstMedia);

  return {
    noteId: note._id,
    title: note.title || 'Без названия',
    category: note.category || '',
    contentPreview: note.content?.trim()
      ? note.content.trim().slice(0, 200)
      : undefined,
    previewUrl: firstMedia?.url,
    previewResourceType: firstMedia?.resourceType,
    previewEncrypted: firstPlainEnvelope ? true : firstMedia?.encrypted,
    previewMediaEnvelope: firstPlainEnvelope,
    previewEncryptedMediaEnvelope: firstPlainEnvelope
      ? undefined
      : firstMedia?.encryptedMediaEnvelope,
    previewMetadataSenderId: note.metadataSenderId,
    previewMetadataRecipientId: note.metadataRecipientId,
    updatedAt: note.updatedAt,
    media: mediaItems.map(mapMediaRef)
  };
};

export const prepareNoteForShare = async (
  keys: LocalDeviceKeys,
  note: NoteLikeForShare,
  currentUserId?: string,
  fallbackPartnerId?: string
): Promise<SharedNoteRef> => {
  if (!note.media?.length) {
    return buildSharedNoteRef(note);
  }

  const media = await Promise.all(
    note.media.map(async (item) => {
      if (!item.url?.trim()) {
        return item;
      }

      const decrypted = await enrichItemWithDecryptedMedia(
        keys,
        {
          encrypted: item.encrypted ?? true,
          encryptedMediaEnvelope: item.encryptedMediaEnvelope,
          mediaEnvelope: item.mediaEnvelope,
          metadataSenderId: note.metadataSenderId,
          metadataRecipientId: note.metadataRecipientId
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

  return buildSharedNoteRef({ ...note, media });
};

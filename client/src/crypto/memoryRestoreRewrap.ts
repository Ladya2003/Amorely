import axios from 'axios';
import i18n from '../localization';
import { API_URL } from '../config';
import type { CalendarEventForMigration } from './calendarEventPartnerMigration';
import type { PlanNoteForMigration } from './planNotePartnerMigration';
import {
  decryptContentFields,
  decryptContentMediaEnvelope,
  decryptPlanNoteFields,
  encryptMediaEnvelopeForPartner,
  encryptTextForPartner,
  normalizeUserId,
  type EncryptedTextPayload,
  type RawContentFields
} from './contentCryptoService';
import {
  invalidatePeerPublicKeyCache,
  prefetchPeerPublicKey,
  type LocalDeviceKeys
} from './cryptoService';
import type { MemoryRestoreProgress } from '../services/memoryRestoreService';
import {
  saveRestoredEventCopies,
  saveRestoredFeedCopies,
  saveRestoredPlanCopies
} from '../services/memoryRestoreService';

export type MemoryRestoreStage = 'events' | 'plans' | 'feed' | 'done';

export type MemoryRestoreJobProgress = MemoryRestoreProgress & {
  stage: MemoryRestoreStage;
};

const ENCRYPT_OPTIONS = { bypassCache: true as const };

const isDecryptFailedText = (value?: string) => {
  const failed = i18n.t('crypto.decryptFailed');
  return !value || value === failed;
};

const resolveAuthorId = (item: { userId?: unknown; createdBy?: unknown }): string | null =>
  normalizeUserId(item.userId) || normalizeUserId(item.createdBy);

const buildMediaContext = (
  mediaItem: RawContentFields,
  parent: RawContentFields
): RawContentFields => ({
  ...mediaItem,
  encrypted: mediaItem.encrypted ?? parent.encrypted,
  metadataSenderId:
    mediaItem.metadataSenderId || parent.metadataSenderId || normalizeUserId(parent.userId) || undefined,
  metadataRecipientId: mediaItem.metadataRecipientId || parent.metadataRecipientId || undefined,
  userId: mediaItem.userId || parent.userId,
  createdBy: mediaItem.createdBy || parent.createdBy
});

const encryptRequesterText = (
  keys: LocalDeviceKeys,
  requesterUserId: string,
  plaintext: string
) => encryptTextForPartner(keys, requesterUserId, plaintext, ENCRYPT_OPTIONS);

const encryptRequesterMedia = (
  keys: LocalDeviceKeys,
  requesterUserId: string,
  secrets: { mediaKey: string; iv: string }
) => encryptMediaEnvelopeForPartner(keys, requesterUserId, secrets, ENCRYPT_OPTIONS);

const assignRequesterCopy = (
  isRequesterOwned: boolean,
  payload: EncryptedTextPayload
): {
  self?: EncryptedTextPayload;
  partner?: EncryptedTextPayload;
} => (isRequesterOwned ? { self: payload } : { partner: payload });

export const runMemoryRestoreRewrap = async (
  keys: LocalDeviceKeys,
  helperUserId: string,
  requesterUserId: string,
  requestId: string,
  onProgress?: (progress: MemoryRestoreJobProgress) => void
): Promise<MemoryRestoreProgress> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Не авторизован');
  }

  await invalidatePeerPublicKeyCache(requesterUserId);
  await prefetchPeerPublicKey(requesterUserId);

  const [eventsResponse, plansResponse, feedResponse] = await Promise.all([
    axios.get<CalendarEventForMigration[]>(`${API_URL}/api/calendar/events`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    axios.get<{ notes?: PlanNoteForMigration[] }>(`${API_URL}/api/calendar/plans`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
    axios.get<Array<RawContentFields & { _id?: string; eventId?: string }>>(
      `${API_URL}/api/feed/user-content`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  ]);

  const events = eventsResponse.data || [];
  const notes = plansResponse.data?.notes || [];
  const feedItems = (feedResponse.data || []).filter((item) => !item.eventId);

  const progress: MemoryRestoreJobProgress = {
    stage: 'events',
    events: 0,
    plans: 0,
    feed: 0,
    failed: 0,
    total: events.length + notes.length + feedItems.length
  };
  onProgress?.(progress);

  for (const event of events) {
    const eventId = event.eventId || event._id;
    const authorId = resolveAuthorId(event);
    if (!eventId || !authorId) {
      progress.failed += 1;
      onProgress?.({ ...progress });
      continue;
    }

    const isRequesterOwned = authorId === requesterUserId;
    if (authorId !== helperUserId && !isRequesterOwned) {
      continue;
    }

    try {
      const decrypted = await decryptContentFields(keys, event, helperUserId, requesterUserId);
      const hasTitle = Boolean(
        event.encryptedTitle?.ciphertext || event.encryptedTitlePartner?.ciphertext
      );
      const titleOk = !hasTitle || !isDecryptFailedText(decrypted.title);

      let titleCopy: EncryptedTextPayload | undefined;
      let descriptionCopy: EncryptedTextPayload | undefined;

      if (hasTitle && titleOk && decrypted.title) {
        titleCopy = await encryptRequesterText(keys, requesterUserId, decrypted.title);
        if (event.encryptedDescription?.ciphertext || event.encryptedDescriptionPartner?.ciphertext) {
          descriptionCopy = await encryptRequesterText(
            keys,
            requesterUserId,
            decrypted.description || ''
          );
        }
      } else if (hasTitle && !titleOk) {
        progress.failed += 1;
        onProgress?.({ ...progress });
        continue;
      }

      const mediaCopies: Array<{
        mediaId: string;
        encryptedMediaEnvelope?: EncryptedTextPayload;
        encryptedMediaEnvelopePartner?: EncryptedTextPayload;
      }> = [];

      for (const mediaItem of event.media || []) {
        if (
          !mediaItem._id ||
          (!mediaItem.encryptedMediaEnvelope?.ciphertext &&
            !mediaItem.encryptedMediaEnvelopePartner?.ciphertext)
        ) {
          continue;
        }

        const envelope = await decryptContentMediaEnvelope(
          keys,
          buildMediaContext(mediaItem, event),
          helperUserId,
          requesterUserId
        );
        if (!envelope?.mediaKey || !envelope.iv) {
          continue;
        }

        const encrypted = await encryptRequesterMedia(keys, requesterUserId, {
          mediaKey: envelope.mediaKey,
          iv: envelope.iv
        });
        const assigned = assignRequesterCopy(isRequesterOwned, encrypted);
        mediaCopies.push({
          mediaId: String(mediaItem._id),
          encryptedMediaEnvelope: assigned.self,
          encryptedMediaEnvelopePartner: assigned.partner
        });
      }

      const assignedTitle = titleCopy ? assignRequesterCopy(isRequesterOwned, titleCopy) : undefined;
      const assignedDescription = descriptionCopy
        ? assignRequesterCopy(isRequesterOwned, descriptionCopy)
        : undefined;

      if (assignedTitle || assignedDescription || mediaCopies.length > 0) {
        await saveRestoredEventCopies(token, requestId, {
          eventId,
          encryptedTitle: assignedTitle?.self,
          encryptedDescription: assignedDescription?.self,
          encryptedTitlePartner: assignedTitle?.partner,
          encryptedDescriptionPartner: assignedDescription?.partner,
          mediaCopies
        });
      }

      progress.events += 1;
      onProgress?.({ ...progress });
    } catch (error) {
      console.error('Не удалось восстановить событие:', eventId, error);
      progress.failed += 1;
      onProgress?.({ ...progress });
    }
  }

  progress.stage = 'plans';
  onProgress?.({ ...progress });

  for (const note of notes) {
    const noteId = note._id;
    const authorId = resolveAuthorId(note);
    if (!noteId || !authorId) {
      progress.failed += 1;
      onProgress?.({ ...progress });
      continue;
    }

    const isRequesterOwned = authorId === requesterUserId;
    if (authorId !== helperUserId && !isRequesterOwned) {
      continue;
    }

    try {
      const decrypted = await decryptPlanNoteFields(keys, note, helperUserId, requesterUserId);
      const hasTitle = Boolean(
        note.encryptedTitle?.ciphertext || note.encryptedTitlePartner?.ciphertext
      );
      if (hasTitle && isDecryptFailedText(decrypted.title)) {
        progress.failed += 1;
        onProgress?.({ ...progress });
        continue;
      }

      let titleCopy: EncryptedTextPayload | undefined;
      let contentCopy: EncryptedTextPayload | undefined;
      let categoryCopy: EncryptedTextPayload | undefined;

      if (hasTitle && decrypted.title) {
        titleCopy = await encryptRequesterText(keys, requesterUserId, decrypted.title);
        if (note.encryptedContent?.ciphertext || note.encryptedContentPartner?.ciphertext) {
          contentCopy = await encryptRequesterText(keys, requesterUserId, decrypted.content || '');
        }
        if (note.encryptedCategory?.ciphertext || note.encryptedCategoryPartner?.ciphertext) {
          categoryCopy = await encryptRequesterText(keys, requesterUserId, decrypted.category || '');
        }
      }

      const mediaCopies: Array<{
        mediaId: string;
        encryptedMediaEnvelope?: EncryptedTextPayload;
        encryptedMediaEnvelopePartner?: EncryptedTextPayload;
      }> = [];

      for (const mediaItem of note.media || []) {
        if (
          !mediaItem._id ||
          (!mediaItem.encryptedMediaEnvelope?.ciphertext &&
            !mediaItem.encryptedMediaEnvelopePartner?.ciphertext)
        ) {
          continue;
        }

        const envelope = await decryptContentMediaEnvelope(
          keys,
          buildMediaContext(mediaItem, {
            ...mediaItem,
            metadataSenderId: mediaItem.metadataSenderId || note.metadataSenderId,
            metadataRecipientId: mediaItem.metadataRecipientId || note.metadataRecipientId,
            userId: mediaItem.userId || note.userId,
            createdBy: mediaItem.createdBy || note.createdBy
          }),
          helperUserId,
          requesterUserId
        );
        if (!envelope?.mediaKey || !envelope.iv) {
          continue;
        }

        const encrypted = await encryptRequesterMedia(keys, requesterUserId, {
          mediaKey: envelope.mediaKey,
          iv: envelope.iv
        });
        const assigned = assignRequesterCopy(isRequesterOwned, encrypted);
        mediaCopies.push({
          mediaId: String(mediaItem._id),
          encryptedMediaEnvelope: assigned.self,
          encryptedMediaEnvelopePartner: assigned.partner
        });
      }

      const assignedTitle = titleCopy ? assignRequesterCopy(isRequesterOwned, titleCopy) : undefined;
      const assignedContent = contentCopy
        ? assignRequesterCopy(isRequesterOwned, contentCopy)
        : undefined;
      const assignedCategory = categoryCopy
        ? assignRequesterCopy(isRequesterOwned, categoryCopy)
        : undefined;

      if (assignedTitle || assignedContent || assignedCategory || mediaCopies.length > 0) {
        await saveRestoredPlanCopies(token, requestId, {
          planId: String(noteId),
          encryptedTitle: assignedTitle?.self,
          encryptedContent: assignedContent?.self,
          encryptedCategory: assignedCategory?.self,
          encryptedTitlePartner: assignedTitle?.partner,
          encryptedContentPartner: assignedContent?.partner,
          encryptedCategoryPartner: assignedCategory?.partner,
          mediaCopies
        });
      }

      progress.plans += 1;
      onProgress?.({ ...progress });
    } catch (error) {
      console.error('Не удалось восстановить план:', noteId, error);
      progress.failed += 1;
      onProgress?.({ ...progress });
    }
  }

  progress.stage = 'feed';
  onProgress?.({ ...progress });

  for (const item of feedItems) {
    const contentId = item._id;
    const authorId = resolveAuthorId(item);
    if (!contentId || !authorId) {
      progress.failed += 1;
      onProgress?.({ ...progress });
      continue;
    }

    const isRequesterOwned = authorId === requesterUserId;
    if (authorId !== helperUserId && !isRequesterOwned) {
      continue;
    }

    const hasEncrypted =
      Boolean(item.encryptedTitle?.ciphertext || item.encryptedTitlePartner?.ciphertext) ||
      Boolean(item.encryptedMediaEnvelope?.ciphertext || item.encryptedMediaEnvelopePartner?.ciphertext);
    if (!hasEncrypted) {
      continue;
    }

    try {
      const decrypted = await decryptContentFields(keys, item, helperUserId, requesterUserId);
      const hasTitle = Boolean(
        item.encryptedTitle?.ciphertext || item.encryptedTitlePartner?.ciphertext
      );
      if (hasTitle && isDecryptFailedText(decrypted.title)) {
        progress.failed += 1;
        onProgress?.({ ...progress });
        continue;
      }

      let titleCopy: EncryptedTextPayload | undefined;
      let descriptionCopy: EncryptedTextPayload | undefined;
      if (hasTitle && decrypted.title) {
        titleCopy = await encryptRequesterText(keys, requesterUserId, decrypted.title);
        if (item.encryptedDescription?.ciphertext || item.encryptedDescriptionPartner?.ciphertext) {
          descriptionCopy = await encryptRequesterText(
            keys,
            requesterUserId,
            decrypted.description || ''
          );
        }
      }

      let mediaCopy: EncryptedTextPayload | undefined;
      if (item.encryptedMediaEnvelope?.ciphertext || item.encryptedMediaEnvelopePartner?.ciphertext) {
        const envelope = await decryptContentMediaEnvelope(
          keys,
          item,
          helperUserId,
          requesterUserId
        );
        if (envelope?.mediaKey && envelope.iv) {
          mediaCopy = await encryptRequesterMedia(keys, requesterUserId, {
            mediaKey: envelope.mediaKey,
            iv: envelope.iv
          });
        }
      }

      const assignedTitle = titleCopy ? assignRequesterCopy(isRequesterOwned, titleCopy) : undefined;
      const assignedDescription = descriptionCopy
        ? assignRequesterCopy(isRequesterOwned, descriptionCopy)
        : undefined;
      const assignedMedia = mediaCopy ? assignRequesterCopy(isRequesterOwned, mediaCopy) : undefined;

      if (assignedTitle || assignedDescription || assignedMedia) {
        await saveRestoredFeedCopies(token, requestId, {
          contentId: String(contentId),
          encryptedTitle: assignedTitle?.self,
          encryptedDescription: assignedDescription?.self,
          encryptedMediaEnvelope: assignedMedia?.self,
          encryptedTitlePartner: assignedTitle?.partner,
          encryptedDescriptionPartner: assignedDescription?.partner,
          encryptedMediaEnvelopePartner: assignedMedia?.partner
        });
      }

      progress.feed += 1;
      onProgress?.({ ...progress });
    } catch (error) {
      console.error('Не удалось восстановить элемент ленты:', contentId, error);
      progress.failed += 1;
      onProgress?.({ ...progress });
    }
  }

  progress.stage = 'done';
  onProgress?.({ ...progress });

  return {
    events: progress.events,
    plans: progress.plans,
    feed: progress.feed,
    failed: progress.failed,
    total: progress.total
  };
};

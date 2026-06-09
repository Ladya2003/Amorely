import axios from 'axios';
import { API_URL } from '../config';
import {
  decryptContentMediaEnvelope,
  decryptPlanNoteFields,
  encryptDualMediaEnvelopeForContent,
  encryptDualTextForContent,
  normalizeUserId,
  type RawContentFields,
  type RawPlanNoteFields
} from './contentCryptoService';
import type { LocalDeviceKeys } from './cryptoService';
import { LEGACY_CRYPTO_HEAL_KEY } from './calendarEventPartnerMigration';

export type PlanNoteMediaForMigration = RawContentFields & {
  _id?: string;
};

export type PlanNoteForMigration = RawPlanNoteFields & {
  _id?: string;
  userId?: string | { _id?: string };
  createdBy?: string | { _id?: string };
  media?: PlanNoteMediaForMigration[];
};

export const getPlansPartnerMigrationSessionKey = (selfUserId: string, partnerUserId: string) =>
  `plans-partner-migration:v1:${selfUserId}:${partnerUserId}`;

const resolvePlanAuthorId = (note: PlanNoteForMigration): string | undefined => {
  const authorId = normalizeUserId(note.userId) || normalizeUserId(note.createdBy);
  return authorId || undefined;
};

export const needsPlanPartnerCopyMigration = (
  note: PlanNoteForMigration,
  selfUserId: string,
  healLegacyDualCopy: boolean
): boolean => {
  if (resolvePlanAuthorId(note) !== selfUserId) {
    return false;
  }

  const missingTitlePartner = Boolean(
    note.encryptedTitle?.ciphertext && !note.encryptedTitlePartner?.ciphertext
  );
  const missingContentPartner = Boolean(
    note.encryptedContent?.ciphertext && !note.encryptedContentPartner?.ciphertext
  );
  const missingCategoryPartner = Boolean(
    note.encryptedCategory?.ciphertext && !note.encryptedCategoryPartner?.ciphertext
  );
  const missingMediaPartner = (note.media || []).some(
    (item) =>
      item.encryptedMediaEnvelope?.ciphertext && !item.encryptedMediaEnvelopePartner?.ciphertext
  );
  const needsLegacySelfCopyHeal = Boolean(
    healLegacyDualCopy &&
      note.encryptedTitle?.ciphertext &&
      note.encryptedTitlePartner?.ciphertext
  );

  return (
    missingTitlePartner ||
    missingContentPartner ||
    missingCategoryPartner ||
    missingMediaPartner ||
    needsLegacySelfCopyHeal
  );
};

export const migratePlanNotesPartnerCopies = async (
  notes: PlanNoteForMigration[],
  keys: LocalDeviceKeys,
  selfUserId: string,
  partnerUserId: string,
  options?: { healLegacyDualCopy?: boolean }
): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token || !partnerUserId || partnerUserId === selfUserId) {
    return false;
  }

  const healLegacyDualCopy = options?.healLegacyDualCopy ?? false;
  let changed = false;

  for (const note of notes) {
    if (!needsPlanPartnerCopyMigration(note, selfUserId, healLegacyDualCopy)) {
      continue;
    }

    const noteId = note._id;
    if (!noteId) {
      continue;
    }

    const missingTitlePartner = Boolean(
      note.encryptedTitle?.ciphertext && !note.encryptedTitlePartner?.ciphertext
    );
    const missingContentPartner = Boolean(
      note.encryptedContent?.ciphertext && !note.encryptedContentPartner?.ciphertext
    );
    const missingCategoryPartner = Boolean(
      note.encryptedCategory?.ciphertext && !note.encryptedCategoryPartner?.ciphertext
    );
    const needsTextReencrypt = Boolean(
      missingTitlePartner ||
        missingContentPartner ||
        missingCategoryPartner ||
        (healLegacyDualCopy &&
          note.encryptedTitle?.ciphertext &&
          note.encryptedTitlePartner?.ciphertext)
    );

    let titleDual: Awaited<ReturnType<typeof encryptDualTextForContent>> | undefined;
    let contentDual: Awaited<ReturnType<typeof encryptDualTextForContent>> | undefined;
    let categoryDual: Awaited<ReturnType<typeof encryptDualTextForContent>> | undefined;

    if (needsTextReencrypt) {
      const decrypted = await decryptPlanNoteFields(keys, note, selfUserId);
      if (!decrypted.title) {
        continue;
      }

      titleDual = await encryptDualTextForContent(
        keys,
        selfUserId,
        partnerUserId,
        decrypted.title,
        { bypassCache: false }
      );

      if (note.encryptedContent?.ciphertext || note.encryptedContentPartner?.ciphertext) {
        contentDual = await encryptDualTextForContent(
          keys,
          selfUserId,
          partnerUserId,
          decrypted.content,
          { bypassCache: false }
        );
      }

      categoryDual = await encryptDualTextForContent(
        keys,
        selfUserId,
        partnerUserId,
        decrypted.category,
        { bypassCache: false }
      );
    }

    const mediaPartnerCopies: Array<{
      mediaId: string;
      encryptedMediaEnvelopePartner: { ciphertext: string; iv: string };
      encryptedMediaEnvelope?: { ciphertext: string; iv: string };
    }> = [];

    for (const mediaItem of note.media || []) {
      const missingPartnerMedia = Boolean(
        mediaItem.encryptedMediaEnvelope?.ciphertext &&
          !mediaItem.encryptedMediaEnvelopePartner?.ciphertext
      );
      const needsMediaReencrypt = Boolean(
        missingPartnerMedia ||
          (healLegacyDualCopy &&
            mediaItem.encryptedMediaEnvelope?.ciphertext &&
            mediaItem.encryptedMediaEnvelopePartner?.ciphertext)
      );

      if (!needsMediaReencrypt || !mediaItem._id) {
        continue;
      }

      const mediaContext: RawContentFields = {
        ...mediaItem,
        encrypted: mediaItem.encrypted ?? note.encrypted,
        metadataSenderId:
          mediaItem.metadataSenderId ||
          note.metadataSenderId ||
          resolvePlanAuthorId(note) ||
          undefined,
        metadataRecipientId:
          mediaItem.metadataRecipientId ||
          note.metadataRecipientId ||
          resolvePlanAuthorId(note) ||
          undefined,
        userId: mediaItem.userId || note.userId,
        createdBy: mediaItem.createdBy || note.createdBy
      };

      const envelope = await decryptContentMediaEnvelope(keys, mediaContext, selfUserId);
      if (!envelope?.mediaKey || !envelope.iv) {
        continue;
      }

      const dualEnvelope = await encryptDualMediaEnvelopeForContent(
        keys,
        selfUserId,
        partnerUserId,
        { mediaKey: envelope.mediaKey, iv: envelope.iv },
        { bypassCache: false }
      );

      if (!dualEnvelope.partner) {
        continue;
      }

      mediaPartnerCopies.push({
        mediaId: String(mediaItem._id),
        encryptedMediaEnvelope: dualEnvelope.self,
        encryptedMediaEnvelopePartner: dualEnvelope.partner
      });
    }

    await axios.patch(
      `${API_URL}/api/calendar/plans/${noteId}/partner-copies`,
      {
        encryptedTitle: titleDual?.self,
        encryptedTitlePartner: titleDual?.partner,
        encryptedContent: contentDual?.self,
        encryptedContentPartner: contentDual?.partner,
        encryptedCategory: categoryDual?.self,
        encryptedCategoryPartner: categoryDual?.partner,
        mediaPartnerCopies
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    changed = true;
  }

  return changed;
};

export const runPlansPartnerMigration = async (
  keys: LocalDeviceKeys,
  selfUserId: string,
  partnerUserId: string,
  options?: { force?: boolean }
): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token || !partnerUserId || partnerUserId === selfUserId) {
    return false;
  }

  const response = await axios.get(`${API_URL}/api/calendar/plans`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const healLegacyDualCopy = localStorage.getItem(LEGACY_CRYPTO_HEAL_KEY) !== '1';
  const notes: PlanNoteForMigration[] = response.data?.notes || [];
  const hasPendingMigration = notes.some((note) =>
    needsPlanPartnerCopyMigration(note, selfUserId, healLegacyDualCopy)
  );
  const migrationKey = getPlansPartnerMigrationSessionKey(selfUserId, partnerUserId);

  if (!options?.force && sessionStorage.getItem(migrationKey) === '1' && !hasPendingMigration) {
    return false;
  }

  const migrated = await migratePlanNotesPartnerCopies(
    notes,
    keys,
    selfUserId,
    partnerUserId,
    { healLegacyDualCopy }
  );

  if (!hasPendingMigration || migrated) {
    sessionStorage.setItem(migrationKey, '1');
    if (healLegacyDualCopy && migrated) {
      localStorage.setItem(LEGACY_CRYPTO_HEAL_KEY, '1');
    }
  }

  return migrated;
};

import axios from 'axios';
import { API_URL } from '../config';
import {
  decryptContentMediaEnvelope,
  decryptOwnContentText,
  encryptDualMediaEnvelopeForContent,
  encryptDualTextForContent,
  normalizeUserId,
  type RawContentFields
} from './contentCryptoService';
import type { LocalDeviceKeys } from './cryptoService';

export type CalendarEventMediaForMigration = RawContentFields & {
  _id?: string;
};

export type CalendarEventForMigration = RawContentFields & {
  eventId?: string;
  _id?: string;
  userId?: string;
  partnerSharedAt?: string;
  media?: CalendarEventMediaForMigration[];
};

export const LEGACY_CRYPTO_HEAL_KEY = 'calendar-crypto-heal-v1';

export const getPartnerMigrationSessionKey = (selfUserId: string, partnerUserId: string) =>
  `calendar-partner-migration:v2:${selfUserId}:${partnerUserId}`;

export const runCalendarPartnerMigration = async (
  keys: LocalDeviceKeys,
  selfUserId: string,
  partnerUserId: string,
  options?: { force?: boolean }
): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token || !partnerUserId || partnerUserId === selfUserId) {
    return false;
  }

  const response = await axios.get(`${API_URL}/api/calendar/events`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const healLegacyDualCopy = localStorage.getItem(LEGACY_CRYPTO_HEAL_KEY) !== '1';
  const events: CalendarEventForMigration[] = response.data;
  const hasPendingMigration = events.some((event) =>
    needsPartnerCopyMigration(event, selfUserId, healLegacyDualCopy)
  );
  const migrationKey = getPartnerMigrationSessionKey(selfUserId, partnerUserId);

  if (!options?.force && sessionStorage.getItem(migrationKey) === '1' && !hasPendingMigration) {
    return false;
  }

  const migrated = await migrateCalendarEventsPartnerCopies(
    events,
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

export const needsPartnerCopyMigration = (
  event: CalendarEventForMigration,
  selfUserId: string,
  healLegacyDualCopy: boolean
): boolean => {
  if (normalizeUserId(event.userId) !== selfUserId) {
    return false;
  }

  const missingTitlePartner = Boolean(
    event.encryptedTitle?.ciphertext && !event.encryptedTitlePartner?.ciphertext
  );
  const missingMediaPartner = (event.media || []).some(
    (item) =>
      item.encryptedMediaEnvelope?.ciphertext && !item.encryptedMediaEnvelopePartner?.ciphertext
  );
  const needsLegacySelfCopyHeal = Boolean(
    healLegacyDualCopy &&
      event.encryptedTitle?.ciphertext &&
      event.encryptedTitlePartner?.ciphertext
  );

  return missingTitlePartner || missingMediaPartner || needsLegacySelfCopyHeal;
};

export const migrateCalendarEventsPartnerCopies = async (
  events: CalendarEventForMigration[],
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

  for (const event of events) {
    if (!needsPartnerCopyMigration(event, selfUserId, healLegacyDualCopy)) {
      continue;
    }

    const eventId = event.eventId || event._id;
    if (!eventId) {
      continue;
    }

    const missingTitlePartner = Boolean(
      event.encryptedTitle?.ciphertext && !event.encryptedTitlePartner?.ciphertext
    );
    const needsTitleReencrypt = Boolean(
      missingTitlePartner ||
        (healLegacyDualCopy &&
          event.encryptedTitle?.ciphertext &&
          event.encryptedTitlePartner?.ciphertext)
    );

    let titleDual: Awaited<ReturnType<typeof encryptDualTextForContent>> | undefined;
    let descriptionDual: Awaited<ReturnType<typeof encryptDualTextForContent>> | undefined;

    if (needsTitleReencrypt) {
      const title = await decryptOwnContentText(keys, event, 'Title', selfUserId);
      if (!title) {
        continue;
      }

      const description =
        event.encryptedDescription?.ciphertext || event.encryptedDescriptionPartner?.ciphertext
          ? await decryptOwnContentText(keys, event, 'Description', selfUserId)
          : undefined;

      titleDual = await encryptDualTextForContent(
        keys,
        selfUserId,
        partnerUserId,
        title,
        { bypassCache: false }
      );
      descriptionDual =
        description !== undefined
          ? await encryptDualTextForContent(
              keys,
              selfUserId,
              partnerUserId,
              description,
              { bypassCache: false }
            )
          : undefined;
    }

    const mediaPartnerCopies: Array<{
      mediaId: string;
      encryptedMediaEnvelopePartner: { ciphertext: string; iv: string };
      encryptedMediaEnvelope?: { ciphertext: string; iv: string };
    }> = [];

    for (const mediaItem of event.media || []) {
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
        encrypted: mediaItem.encrypted ?? event.encrypted,
        metadataSenderId:
          mediaItem.metadataSenderId || event.metadataSenderId || normalizeUserId(event.userId) || undefined,
        metadataRecipientId:
          mediaItem.metadataRecipientId || event.metadataRecipientId || normalizeUserId(event.userId) || undefined,
        userId: mediaItem.userId || event.userId,
        createdBy: mediaItem.createdBy || event.createdBy
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
      `${API_URL}/api/calendar/events/${eventId}/partner-copies`,
      {
        encryptedTitle: titleDual?.self,
        encryptedDescription: descriptionDual?.self,
        encryptedTitlePartner: titleDual?.partner,
        encryptedDescriptionPartner: descriptionDual?.partner,
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

import axios from 'axios';
import { API_URL } from '../config';
import {
  decryptContentMediaEnvelope,
  encryptDualMediaEnvelopeForContent,
  encryptDualTextForContent,
  decryptOwnContentText,
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

export const needsPartnerCopyMigration = (
  event: CalendarEventForMigration,
  selfUserId: string,
  partnerUserId: string
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

  const missingPartnerSharedAt = Boolean(
    event.encryptedTitlePartner?.ciphertext &&
      !event.partnerSharedAt &&
      normalizeUserId(event.metadataRecipientId) === partnerUserId
  );

  return missingTitlePartner || missingMediaPartner || missingPartnerSharedAt;
};

export const migrateCalendarEventsPartnerCopies = async (
  events: CalendarEventForMigration[],
  keys: LocalDeviceKeys,
  selfUserId: string,
  partnerUserId: string
): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token || !partnerUserId || partnerUserId === selfUserId) {
    return false;
  }

  let changed = false;

  for (const event of events) {
    if (!needsPartnerCopyMigration(event, selfUserId, partnerUserId)) {
      continue;
    }

    const eventId = event.eventId || event._id;
    if (!eventId) {
      continue;
    }

    const missingTitlePartner = Boolean(
      event.encryptedTitle?.ciphertext && !event.encryptedTitlePartner?.ciphertext
    );

    let titleDual: Awaited<ReturnType<typeof encryptDualTextForContent>> | undefined;
    let descriptionDual: Awaited<ReturnType<typeof encryptDualTextForContent>> | undefined;

    if (missingTitlePartner) {
      const title = await decryptOwnContentText(keys, event, 'Title', selfUserId);
      if (!title) {
        continue;
      }

      const description =
        event.encryptedDescription?.ciphertext || event.encryptedDescriptionPartner?.ciphertext
          ? await decryptOwnContentText(keys, event, 'Description', selfUserId)
          : undefined;

      titleDual = await encryptDualTextForContent(keys, selfUserId, partnerUserId, title);
      descriptionDual =
        description !== undefined
          ? await encryptDualTextForContent(keys, selfUserId, partnerUserId, description)
          : undefined;
    }

    const mediaPartnerCopies: Array<{
      mediaId: string;
      encryptedMediaEnvelopePartner: { ciphertext: string; iv: string };
    }> = [];

    for (const mediaItem of event.media || []) {
      if (
        !mediaItem.encryptedMediaEnvelope?.ciphertext ||
        mediaItem.encryptedMediaEnvelopePartner?.ciphertext ||
        !mediaItem._id
      ) {
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
        { mediaKey: envelope.mediaKey, iv: envelope.iv }
      );

      if (!dualEnvelope.partner) {
        continue;
      }

      mediaPartnerCopies.push({
        mediaId: String(mediaItem._id),
        encryptedMediaEnvelopePartner: dualEnvelope.partner
      });
    }

    await axios.patch(
      `${API_URL}/api/calendar/events/${eventId}/partner-copies`,
      {
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

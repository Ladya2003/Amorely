import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import Content from '../models/content';
import PlanNote from '../models/planNote';
import { fieldMatchesUserId, hasActivePartner, normalizeIdStr } from './normalizeId';
import {
  findLatestBrokenUpRelationshipForUser,
  getBreakupContentChoiceForUser,
  getPartnerIdFromRelationship
} from './relationshipHelpers';
import { resolvePartnerUserId } from './resolvePartnerId';

type ContentItem = {
  userId?: { toString(): string } | string | null;
  createdBy?: { toString(): string } | string | null;
  createdAt?: Date | string | null;
};

type ExPartnerBreakupContext = {
  exPartnerId: string;
  keepEvents: boolean;
  keepPlans: boolean;
  relationshipLinkedAt: Date;
};

export const getRelationshipLinkedAt = (relationship: {
  createdAt?: Date | string | null;
  startDate?: Date | string | null;
}): Date | null => {
  if (relationship.createdAt) {
    return new Date(relationship.createdAt);
  }

  if (relationship.startDate) {
    return new Date(relationship.startDate);
  }

  return null;
};

const isOnOrAfterDate = (value: unknown, cutoffDate: Date): boolean => {
  if (!value) {
    return false;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  return !Number.isNaN(date.getTime()) && date.getTime() >= cutoffDate.getTime();
};

/** Контент, опубликованный после привязки партнёров в приложении. */
export const isPublishedDuringRelationship = (
  item: ContentItem,
  relationshipLinkedAt: Date
): boolean => isOnOrAfterDate(item.createdAt, relationshipLinkedAt);

const deleteEventMediaFromCloudinary = async (mediaItems: any[]) => {
  for (const media of mediaItems) {
    if (!media.publicId || media.publicId.startsWith('text_')) continue;
    try {
      await cloudinary.uploader.destroy(media.publicId, {
        resource_type: media.encrypted ? 'raw' : (media.resourceType as 'image' | 'video' | 'raw')
      });
    } catch (cloudinaryError) {
      console.error('Ошибка при удалении медиа события из Cloudinary:', cloudinaryError);
    }
  }
};

const deletePlanNoteMediaFromCloudinary = async (mediaItems: any[]) => {
  for (const media of mediaItems) {
    if (!media.publicId) continue;
    try {
      await cloudinary.uploader.destroy(media.publicId, { resource_type: 'raw' });
    } catch (cloudinaryError) {
      console.error('Ошибка при удалении медиа заметки из Cloudinary:', cloudinaryError);
    }
  }
};

const convertEventToSolo = async (eventId: string, userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  await Content.updateMany(
    {
      eventId,
      ...fieldMatchesUserId('userId', userId)
    },
    {
      $set: {
        targetId: userObjectId,
        metadataRecipientId: userObjectId
      },
      $unset: {
        encryptedTitlePartner: 1,
        encryptedDescriptionPartner: 1,
        encryptedMediaEnvelopePartner: 1,
        partnerSharedAt: 1
      }
    }
  );
};

const convertPlanToSolo = async (noteId: string, userId: string) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const note = await PlanNote.findOne({
    _id: noteId,
    ...fieldMatchesUserId('userId', userId)
  });
  if (!note) return;

  note.partnerId = undefined;
  note.encryptedTitlePartner = undefined;
  note.encryptedContentPartner = undefined;
  note.encryptedCategoryPartner = undefined;
  note.metadataRecipientId = userObjectId;

  for (const media of note.media) {
    media.encryptedMediaEnvelopePartner = undefined;
    media.metadataRecipientId = userObjectId;
  }

  await note.save();
};

const findOwnedEventMedia = async (eventId: string, userId: string) =>
  Content.find({
    eventId,
    ...fieldMatchesUserId('userId', userId)
  });

export const cleanupEventsOnBreakup = async (
  userId: string,
  relationshipLinkedAt: Date,
  keepEvents: boolean
) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) return;

  const userEvents = await Content.find({
    eventId: { $exists: true, $nin: [null, ''] },
    $or: [
      fieldMatchesUserId('userId', normalizedUserId),
      fieldMatchesUserId('createdBy', normalizedUserId)
    ]
  });

  const eventIds = new Set<string>();
  for (const media of userEvents) {
    if (!media.eventId || eventIds.has(media.eventId)) continue;
    eventIds.add(media.eventId);

    if (!isPublishedDuringRelationship(media, relationshipLinkedAt)) {
      await convertEventToSolo(media.eventId, normalizedUserId);
      continue;
    }

    if (keepEvents) {
      continue;
    } else {
      const allMedia = await findOwnedEventMedia(media.eventId, normalizedUserId);
      await deleteEventMediaFromCloudinary(allMedia);
      await Content.deleteMany({
        eventId: media.eventId,
        ...fieldMatchesUserId('userId', normalizedUserId)
      });
    }
  }
};

export const cleanupPlansOnBreakup = async (
  userId: string,
  relationshipLinkedAt: Date,
  keepPlans: boolean
) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) return;

  const userPlans = await PlanNote.find({
    $or: [
      fieldMatchesUserId('userId', normalizedUserId),
      fieldMatchesUserId('createdBy', normalizedUserId)
    ]
  });

  for (const note of userPlans) {
    if (!isPublishedDuringRelationship(note, relationshipLinkedAt)) {
      await convertPlanToSolo(note._id.toString(), normalizedUserId);
      continue;
    }

    if (keepPlans) {
      continue;
    } else {
      await deletePlanNoteMediaFromCloudinary(note.media);
      await PlanNote.deleteOne({ _id: note._id });
    }
  }
};

export const cleanupUserContentOnBreakup = async (
  userId: string,
  relationshipLinkedAt: Date,
  options: { keepEvents: boolean; keepPlans: boolean }
) => {
  await cleanupEventsOnBreakup(userId, relationshipLinkedAt, options.keepEvents);
  await cleanupPlansOnBreakup(userId, relationshipLinkedAt, options.keepPlans);
};

const resolveAuthorId = (item: ContentItem): string | null =>
  normalizeIdStr(item.userId) || normalizeIdStr(item.createdBy);

export const getExPartnerBreakupContext = async (
  userId: string
): Promise<ExPartnerBreakupContext | null> => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return null;
  }

  const partnerId = await resolvePartnerUserId(normalizedUserId);
  if (hasActivePartner(normalizedUserId, partnerId)) {
    return null;
  }

  const brokenUpRelationship = await findLatestBrokenUpRelationshipForUser(normalizedUserId);
  if (!brokenUpRelationship) {
    return null;
  }

  const exPartnerId = getPartnerIdFromRelationship(brokenUpRelationship, normalizedUserId);
  const relationshipLinkedAt = getRelationshipLinkedAt(brokenUpRelationship);
  if (!exPartnerId || !relationshipLinkedAt) {
    return null;
  }

  const exChoice = getBreakupContentChoiceForUser(brokenUpRelationship, exPartnerId);
  if (!exChoice) {
    return null;
  }

  return {
    exPartnerId,
    keepEvents: Boolean(exChoice.keepEvents),
    keepPlans: Boolean(exChoice.keepPlans),
    relationshipLinkedAt
  };
};

export const shouldSoftHideSharedContentOnDelete = (
  deleterUserId: string,
  item: ContentItem,
  exPartnerContext: ExPartnerBreakupContext | null,
  contentKind: 'events' | 'plans'
): boolean => {
  if (!exPartnerContext) {
    return false;
  }

  if (!isPublishedDuringRelationship(item, exPartnerContext.relationshipLinkedAt)) {
    return false;
  }

  const authorId = resolveAuthorId(item);
  const deleterId = normalizeIdStr(deleterUserId);
  if (!authorId || !deleterId) {
    return false;
  }

  if (authorId !== deleterId) {
    return true;
  }

  return contentKind === 'plans' ? exPartnerContext.keepPlans : exPartnerContext.keepEvents;
};

const purgeCalendarEventIfFullyHidden = async (
  eventId: string,
  participantIds: string[]
) => {
  const mediaFiles = await Content.find({ eventId }).limit(1);
  const baseMedia = mediaFiles[0];
  if (!baseMedia) {
    return;
  }

  const hiddenIds = new Set(
    (baseMedia.hiddenFromUserIds || []).map((id) => normalizeIdStr(id)).filter(Boolean) as string[]
  );

  const allHidden = participantIds.every((id) => hiddenIds.has(id));
  if (!allHidden) {
    return;
  }

  const allMedia = await Content.find({ eventId });
  await deleteEventMediaFromCloudinary(allMedia);
  await Content.deleteMany({ eventId });
};

export const hideCalendarEventForUser = async (
  eventId: string,
  userId: string,
  exPartnerId?: string | null
) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return;
  }

  const userObjectId = new mongoose.Types.ObjectId(normalizedUserId);
  await Content.updateMany({ eventId }, { $addToSet: { hiddenFromUserIds: userObjectId } });

  if (exPartnerId) {
    await purgeCalendarEventIfFullyHidden(eventId, [normalizedUserId, exPartnerId]);
  }
};

export const deleteOrHideCalendarEventForUser = async (
  eventId: string,
  userId: string
): Promise<'hidden' | 'deleted'> => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return 'deleted';
  }

  const mediaFiles = await Content.find({ eventId });
  if (!mediaFiles.length) {
    return 'deleted';
  }

  const exPartnerContext = await getExPartnerBreakupContext(normalizedUserId);
  if (shouldSoftHideSharedContentOnDelete(normalizedUserId, mediaFiles[0], exPartnerContext, 'events')) {
    await hideCalendarEventForUser(
      eventId,
      normalizedUserId,
      exPartnerContext?.exPartnerId
    );
    return 'hidden';
  }

  await deleteEventMediaFromCloudinary(mediaFiles);
  await Content.deleteMany({ eventId });
  return 'deleted';
};

const purgePlanNoteIfFullyHidden = async (noteId: string, participantIds: string[]) => {
  const note = await PlanNote.findById(noteId);
  if (!note) {
    return;
  }

  const hiddenIds = new Set(
    (note.hiddenFromUserIds || []).map((id) => normalizeIdStr(id)).filter(Boolean) as string[]
  );

  const allHidden = participantIds.every((id) => hiddenIds.has(id));
  if (!allHidden) {
    return;
  }

  await deletePlanNoteMediaFromCloudinary(note.media);
  await PlanNote.deleteOne({ _id: note._id });
};

export const hidePlanNoteForUser = async (
  noteId: string,
  userId: string,
  exPartnerId?: string | null
) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return;
  }

  const userObjectId = new mongoose.Types.ObjectId(normalizedUserId);
  await PlanNote.updateOne({ _id: noteId }, { $addToSet: { hiddenFromUserIds: userObjectId } });

  if (exPartnerId) {
    await purgePlanNoteIfFullyHidden(noteId, [normalizedUserId, exPartnerId]);
  }
};

export const deleteOrHidePlanNoteForUser = async (
  noteId: string,
  userId: string
): Promise<'hidden' | 'deleted'> => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return 'deleted';
  }

  const note = await PlanNote.findById(noteId);
  if (!note) {
    return 'deleted';
  }

  const exPartnerContext = await getExPartnerBreakupContext(normalizedUserId);
  if (shouldSoftHideSharedContentOnDelete(normalizedUserId, note, exPartnerContext, 'plans')) {
    await hidePlanNoteForUser(noteId, normalizedUserId, exPartnerContext?.exPartnerId);
    return 'hidden';
  }

  await deletePlanNoteMediaFromCloudinary(note.media);
  await PlanNote.deleteOne({ _id: note._id });
  return 'deleted';
};

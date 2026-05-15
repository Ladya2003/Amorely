const normalizeId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
};

const formatEncryptedText = (value: unknown) => {
  if (!value || typeof value !== 'object') return undefined;
  const payload = value as { ciphertext?: string; iv?: string };
  if (!payload.ciphertext || !payload.iv) return undefined;
  return { ciphertext: payload.ciphertext, iv: payload.iv };
};

export const formatContentForApi = (media: any) => ({
  id: media._id?.toString(),
  _id: media._id?.toString(),
  url: media.url,
  resourceType: media.resourceType,
  type: media.resourceType === 'video' ? 'video' : 'image',
  encrypted: Boolean(media.encrypted),
  mediaEnvelope: media.mediaEnvelope || undefined,
  encryptedTitle: formatEncryptedText(media.encryptedTitle),
  encryptedDescription: formatEncryptedText(media.encryptedDescription),
  metadataSenderId:
    normalizeId(media.metadataSenderId) ||
    normalizeId(media.createdBy) ||
    normalizeId(media.userId),
  metadataRecipientId:
    normalizeId(media.metadataRecipientId) ||
    (normalizeId(media.targetId) !== normalizeId(media.userId)
      ? normalizeId(media.targetId)
      : undefined),
  targetId: normalizeId(media.targetId),
  userId: normalizeId(media.userId),
  createdBy: normalizeId(media.createdBy),
  title: media.encrypted ? undefined : media.title,
  description: media.encrypted ? undefined : media.description,
  eventDate: media.eventDate,
  createdAt: media.createdAt,
  createdByUser: media.createdBy,
  eventId: media.eventId,
  isBirthdayEvent: media.isBirthdayEvent,
  isAnniversaryEvent: media.isAnniversaryEvent,
  publicId: media.publicId,
  fileSize: media.fileSize
});

export const formatCalendarEventGroup = (media: any) => ({
  _id: media.eventId || media._id?.toString(),
  eventId: media.eventId || media._id?.toString(),
  encrypted: Boolean(media.encrypted),
  encryptedTitle: formatEncryptedText(media.encryptedTitle),
  encryptedDescription: formatEncryptedText(media.encryptedDescription),
  metadataSenderId:
    normalizeId(media.metadataSenderId) ||
    normalizeId(media.createdBy) ||
    normalizeId(media.userId),
  metadataRecipientId:
    normalizeId(media.metadataRecipientId) ||
    (normalizeId(media.targetId) !== normalizeId(media.userId)
      ? normalizeId(media.targetId)
      : undefined),
  targetId: normalizeId(media.targetId),
  userId: normalizeId(media.userId),
  createdBy:
    typeof media.createdBy === 'object' && media.createdBy !== null ? media.createdBy : undefined,
  title: media.encrypted ? undefined : media.title,
  description: media.encrypted ? undefined : media.description,
  eventDate: media.eventDate,
  createdAt: media.createdAt,
  lastEditedBy: media.lastEditedBy,
  lastEditedAt: media.lastEditedAt,
  isBirthdayEvent: media.isBirthdayEvent,
  isAnniversaryEvent: media.isAnniversaryEvent,
  media: [] as any[]
});

export const formatCalendarEventMedia = (media: any) => ({
  _id: media._id?.toString(),
  url: media.url,
  publicId: media.publicId,
  resourceType: media.resourceType,
  fileSize: media.fileSize,
  encrypted: Boolean(media.encrypted),
  mediaEnvelope: media.mediaEnvelope || undefined
});

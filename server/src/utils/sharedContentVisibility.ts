import { fieldMatchesUserId, hasActivePartner, normalizeIdStr } from './normalizeId';

type PartnerLinkField = 'partnerId' | 'targetId';
type MaybeObjectId = { toString(): string } | string | null | undefined;

const encryptedForViewerConditions = (viewerId: string) => [
  fieldMatchesUserId('targetId', viewerId),
  fieldMatchesUserId('metadataRecipientId', viewerId)
];

const partnerEventAccessConditions = (relationshipStartDate?: Date | null) => {
  if (!relationshipStartDate) {
    return [{ _id: { $exists: false } }];
  }

  return [
    { createdAt: { $gte: relationshipStartDate } },
    { partnerSharedAt: { $gte: relationshipStartDate } }
  ];
};

const partnerAuthoredVisibility = (
  partnerId: string,
  relationshipStartDate?: Date | null
) => ({
  $or: [
    {
      $and: [
        fieldMatchesUserId('userId', partnerId),
        { $or: partnerEventAccessConditions(relationshipStartDate) }
      ]
    },
    {
      $and: [
        fieldMatchesUserId('createdBy', partnerId),
        { $or: partnerEventAccessConditions(relationshipStartDate) }
      ]
    }
  ]
});

const encryptedForViewerByOtherAuthor = (
  viewerId: string,
  partnerId: string
) => ({
  $and: [
    { $or: encryptedForViewerConditions(viewerId) },
    {
      $nor: [
        fieldMatchesUserId('userId', partnerId),
        fieldMatchesUserId('createdBy', partnerId)
      ]
    }
  ]
});

export const buildSharedVisibilityQuery = (
  userId: string,
  partnerId?: string | null,
  partnerLinkField: PartnerLinkField = 'partnerId',
  relationshipStartDate?: Date | null
) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return { userId: { $exists: false } };
  }

  if (hasActivePartner(normalizedUserId, partnerId)) {
    const normalizedPartnerId = normalizeIdStr(partnerId)!;

    return {
      $or: [
        fieldMatchesUserId('userId', normalizedUserId),
        fieldMatchesUserId('createdBy', normalizedUserId),
        encryptedForViewerByOtherAuthor(normalizedUserId, normalizedPartnerId),
        partnerAuthoredVisibility(normalizedPartnerId, relationshipStartDate)
      ]
    };
  }

  return {
    $or: [
      fieldMatchesUserId('userId', normalizedUserId),
      fieldMatchesUserId('createdBy', normalizedUserId),
      fieldMatchesUserId(partnerLinkField, normalizedUserId),
      fieldMatchesUserId('metadataRecipientId', normalizedUserId)
    ]
  };
};

const isOnOrAfterRelationshipStart = (
  value: unknown,
  relationshipStartDate?: Date | null
): boolean => {
  if (!relationshipStartDate || !value) {
    return false;
  }

  const date = value instanceof Date ? value : new Date(String(value));
  return !Number.isNaN(date.getTime()) && date.getTime() >= relationshipStartDate.getTime();
};

export const canAccessSharedContent = (
  item: {
    userId?: MaybeObjectId;
    createdBy?: MaybeObjectId;
    partnerId?: MaybeObjectId;
    targetId?: MaybeObjectId;
    metadataRecipientId?: MaybeObjectId;
    eventDate?: Date | string | null;
    createdAt?: Date | string | null;
    partnerSharedAt?: Date | string | null;
  },
  userId: string,
  partnerId?: string | null,
  partnerLinkField: PartnerLinkField = 'partnerId',
  relationshipStartDate?: Date | null
): boolean => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return false;
  }

  const authorId = normalizeIdStr(item.userId);
  const createdById = normalizeIdStr(item.createdBy);
  const linkedPartnerId = normalizeIdStr(item[partnerLinkField]);
  const targetId = normalizeIdStr(item.targetId);
  const metadataRecipientId = normalizeIdStr(item.metadataRecipientId);
  const normalizedPartnerId = normalizeIdStr(partnerId);

  const encryptedForViewer =
    targetId === normalizedUserId || metadataRecipientId === normalizedUserId;

  if (hasActivePartner(normalizedUserId, normalizedPartnerId)) {
    if (authorId === normalizedUserId || createdById === normalizedUserId) {
      return true;
    }

    const isPartnerAuthor =
      authorId === normalizedPartnerId || createdById === normalizedPartnerId;

    if (encryptedForViewer && !isPartnerAuthor) {
      return true;
    }

    if (!isPartnerAuthor) {
      return false;
    }

    return (
      isOnOrAfterRelationshipStart(item.createdAt, relationshipStartDate) ||
      isOnOrAfterRelationshipStart(item.partnerSharedAt, relationshipStartDate)
    );
  }

  return (
    authorId === normalizedUserId ||
    createdById === normalizedUserId ||
    linkedPartnerId === normalizedUserId ||
    metadataRecipientId === normalizedUserId
  );
};

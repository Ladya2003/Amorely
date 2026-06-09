import { fieldMatchesUserId, hasActivePartner, normalizeIdStr } from './normalizeId';

export type BreakupViewContext = {
  exPartnerId: string;
  relationshipLinkedAt: Date;
  keepEvents: boolean;
  keepPlans: boolean;
};

type PartnerLinkField = 'partnerId' | 'targetId';
type MaybeObjectId = { toString(): string } | string | null | undefined;

const encryptedForViewerConditions = (viewerId: string) => [
  fieldMatchesUserId('targetId', viewerId),
  fieldMatchesUserId('metadataRecipientId', viewerId)
];

const partnerEventAccessConditions = (
  viewerId: string,
  relationshipStartDate?: Date | null
) => {
  const conditions: Record<string, unknown>[] = [
    { 'encryptedTitlePartner.ciphertext': { $exists: true, $ne: '' } },
    {
      $and: [
        fieldMatchesUserId('targetId', viewerId),
        { 'encryptedTitlePartner.ciphertext': { $exists: true, $ne: '' } }
      ]
    },
    {
      $and: [
        fieldMatchesUserId('metadataRecipientId', viewerId),
        { 'encryptedTitlePartner.ciphertext': { $exists: true, $ne: '' } }
      ]
    }
  ];

  if (relationshipStartDate) {
    conditions.push(
      { createdAt: { $gte: relationshipStartDate } },
      { partnerSharedAt: { $gte: relationshipStartDate } }
    );
  }

  return conditions;
};

const partnerAuthoredVisibility = (
  partnerId: string,
  viewerId: string,
  relationshipStartDate?: Date | null
) => ({
  $or: [
    {
      $and: [
        fieldMatchesUserId('userId', partnerId),
        { $or: partnerEventAccessConditions(viewerId, relationshipStartDate) }
      ]
    },
    {
      $and: [
        fieldMatchesUserId('createdBy', partnerId),
        { $or: partnerEventAccessConditions(viewerId, relationshipStartDate) }
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

const exPartnerSharedContentDuringRelationship = (
  exPartnerId: string,
  relationshipLinkedAt: Date,
  viewerId: string
) => ({
  $and: [
    {
      $or: [
        fieldMatchesUserId('userId', exPartnerId),
        fieldMatchesUserId('createdBy', exPartnerId)
      ]
    },
    { createdAt: { $gte: relationshipLinkedAt } },
    { 'encryptedTitlePartner.ciphertext': { $exists: true, $ne: '' } },
    {
      $or: [
        fieldMatchesUserId('metadataRecipientId', viewerId),
        fieldMatchesUserId('partnerId', viewerId),
        fieldMatchesUserId('targetId', viewerId)
      ]
    }
  ]
});

export const buildSharedVisibilityQuery = (
  userId: string,
  partnerId?: string | null,
  partnerLinkField: PartnerLinkField = 'partnerId',
  relationshipStartDate?: Date | null,
  breakupViewContext?: BreakupViewContext | null,
  contentKind: 'events' | 'plans' = 'events'
) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return { userId: { $exists: false } };
  }

  const shouldKeepExPartnerContent =
    contentKind === 'plans'
      ? breakupViewContext?.keepPlans
      : breakupViewContext?.keepEvents;

  if (hasActivePartner(normalizedUserId, partnerId)) {
    const normalizedPartnerId = normalizeIdStr(partnerId)!;

    return {
      $or: [
        fieldMatchesUserId('userId', normalizedUserId),
        fieldMatchesUserId('createdBy', normalizedUserId),
        encryptedForViewerByOtherAuthor(normalizedUserId, normalizedPartnerId),
        partnerAuthoredVisibility(
          normalizedPartnerId,
          normalizedUserId,
          relationshipStartDate
        )
      ]
    };
  }

  const soloVisibility: Record<string, unknown>[] = [
    fieldMatchesUserId('userId', normalizedUserId),
    fieldMatchesUserId('createdBy', normalizedUserId)
  ];

  if (
    shouldKeepExPartnerContent &&
    breakupViewContext?.exPartnerId &&
    breakupViewContext.relationshipLinkedAt
  ) {
    soloVisibility.push(
      exPartnerSharedContentDuringRelationship(
        breakupViewContext.exPartnerId,
        breakupViewContext.relationshipLinkedAt,
        normalizedUserId
      )
    );
  }

  return {
    $or: soloVisibility
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
    encryptedTitlePartner?: { ciphertext?: string | null } | null;
  },
  userId: string,
  partnerId?: string | null,
  partnerLinkField: PartnerLinkField = 'partnerId',
  relationshipStartDate?: Date | null,
  breakupViewContext?: BreakupViewContext | null,
  contentKind: 'events' | 'plans' = 'events'
): boolean => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return false;
  }

  const shouldKeepExPartnerContent =
    contentKind === 'plans'
      ? breakupViewContext?.keepPlans
      : breakupViewContext?.keepEvents;

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

    const hasPartnerCopy = Boolean(item.encryptedTitlePartner?.ciphertext);
    if (hasPartnerCopy) {
      return true;
    }

    return (
      isOnOrAfterRelationshipStart(item.createdAt, relationshipStartDate) ||
      isOnOrAfterRelationshipStart(item.partnerSharedAt, relationshipStartDate)
    );
  }

  if (authorId === normalizedUserId || createdById === normalizedUserId) {
    return true;
  }

  if (
    shouldKeepExPartnerContent &&
    breakupViewContext?.exPartnerId &&
    breakupViewContext.relationshipLinkedAt
  ) {
    const isExPartnerAuthor =
      authorId === breakupViewContext.exPartnerId ||
      createdById === breakupViewContext.exPartnerId;

    if (
      isExPartnerAuthor &&
      isOnOrAfterRelationshipStart(item.createdAt, breakupViewContext.relationshipLinkedAt)
    ) {
      const hasPartnerCopy = Boolean(item.encryptedTitlePartner?.ciphertext);
      const intendedForViewer =
        metadataRecipientId === normalizedUserId ||
        linkedPartnerId === normalizedUserId ||
        targetId === normalizedUserId;

      return hasPartnerCopy && intendedForViewer;
    }
  }

  return false;
};

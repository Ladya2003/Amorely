import mongoose from 'mongoose';
import Relationship from '../models/relationship';
import User from '../models/user';
import { fieldMatchesUserId, idsEqual, normalizeIdStr } from './normalizeId';

export const findActiveRelationshipForUser = async (userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return null;
  }

  return Relationship.findOne({
    $or: [
      fieldMatchesUserId('userId', normalizedUserId),
      fieldMatchesUserId('partnerId', normalizedUserId)
    ],
    status: 'active'
  });
};

export const getPartnerIdFromRelationship = (
  relationship: { userId: { toString(): string }; partnerId: { toString(): string } },
  userId: string
): string | null => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return null;
  }

  return idsEqual(relationship.userId, normalizedUserId)
    ? normalizeIdStr(relationship.partnerId)
    : normalizeIdStr(relationship.userId);
};

export const linkUsersAsPartners = async (userId: string, partnerId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  const normalizedPartnerId = normalizeIdStr(partnerId);
  if (!normalizedUserId || !normalizedPartnerId) {
    throw new Error('Invalid user ids for partner link');
  }

  await Promise.all([
    User.updateOne(
      { _id: new mongoose.Types.ObjectId(normalizedUserId) },
      { $set: { partnerId: new mongoose.Types.ObjectId(normalizedPartnerId) } }
    ),
    User.updateOne(
      { _id: new mongoose.Types.ObjectId(normalizedPartnerId) },
      { $set: { partnerId: new mongoose.Types.ObjectId(normalizedUserId) } }
    )
  ]);
};

export const findBrokenUpRelationshipPendingCleanup = async (userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return null;
  }

  const activeRelationship = await findActiveRelationshipForUser(normalizedUserId);
  if (activeRelationship) {
    return null;
  }

  const latestBrokenUp = await Relationship.findOne({
    status: 'broken_up',
    $or: [
      fieldMatchesUserId('userId', normalizedUserId),
      fieldMatchesUserId('partnerId', normalizedUserId)
    ]
  }).sort({ createdAt: -1 });

  if (!latestBrokenUp) {
    return null;
  }

  const handledBy = latestBrokenUp.breakupContentHandledBy || [];
  const alreadyHandled = handledBy.some((id) => idsEqual(id, normalizedUserId));
  if (alreadyHandled) {
    return null;
  }

  return latestBrokenUp;
};

export const findLatestBrokenUpRelationshipForUser = async (userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return null;
  }

  return Relationship.findOne({
    status: 'broken_up',
    $or: [
      fieldMatchesUserId('userId', normalizedUserId),
      fieldMatchesUserId('partnerId', normalizedUserId)
    ]
  }).sort({ createdAt: -1 });
};

export const getBreakupContentChoiceForUser = (
  relationship: {
    breakupContentChoices?: Array<{
      userId?: mongoose.Types.ObjectId | { toString(): string } | null;
      keepEvents?: boolean;
      keepPlans?: boolean;
    }>;
  },
  userId: string
): { keepEvents: boolean; keepPlans: boolean } | null => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return null;
  }

  const choice = (relationship.breakupContentChoices || []).find((entry) =>
    idsEqual(entry.userId, normalizedUserId)
  );

  if (!choice) {
    return null;
  }

  return {
    keepEvents: Boolean(choice.keepEvents),
    keepPlans: Boolean(choice.keepPlans)
  };
};

export const markBreakupContentHandled = (
  relationship: { breakupContentHandledBy?: mongoose.Types.ObjectId[] },
  userId: string
) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return;
  }

  const userObjectId = new mongoose.Types.ObjectId(normalizedUserId);
  const handledBy = relationship.breakupContentHandledBy || [];
  const alreadyHandled = handledBy.some((id) => idsEqual(id, normalizedUserId));

  if (!alreadyHandled) {
    relationship.breakupContentHandledBy = [...handledBy, userObjectId];
  }
};

export const recordBreakupContentChoice = (
  relationship: {
    breakupContentHandledBy?: mongoose.Types.ObjectId[];
    breakupContentChoices?: Array<{
      userId?: mongoose.Types.ObjectId | null;
      keepEvents?: boolean;
      keepPlans?: boolean;
    }>;
  },
  userId: string,
  options: { keepEvents: boolean; keepPlans: boolean }
) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return;
  }

  markBreakupContentHandled(relationship, normalizedUserId);

  const userObjectId = new mongoose.Types.ObjectId(normalizedUserId);
  const choices = [...(relationship.breakupContentChoices || [])];
  const existingIndex = choices.findIndex((entry) => idsEqual(entry.userId, normalizedUserId));
  const nextChoice = {
    userId: userObjectId,
    keepEvents: options.keepEvents,
    keepPlans: options.keepPlans
  };

  if (existingIndex >= 0) {
    choices[existingIndex] = nextChoice;
  } else {
    choices.push(nextChoice);
  }

  relationship.breakupContentChoices = choices;
};

export const unlinkUsersPartners = async (user1Id: string, user2Id: string) => {
  const ids = [normalizeIdStr(user1Id), normalizeIdStr(user2Id)].filter(Boolean) as string[];
  if (ids.length === 0) {
    return;
  }

  await User.updateMany(
    { _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } },
    { $unset: { partnerId: 1 } }
  );
};

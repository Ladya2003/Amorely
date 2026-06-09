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

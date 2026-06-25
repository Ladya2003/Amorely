import mongoose from 'mongoose';
import PartnerRequest from '../models/partnerRequest';
import { fieldMatchesUserId, idsEqual, normalizeIdStr } from './normalizeId';

export const findPendingRequestBetweenUsers = async (userId1: string, userId2: string) => {
  const id1 = normalizeIdStr(userId1);
  const id2 = normalizeIdStr(userId2);
  if (!id1 || !id2) {
    return null;
  }

  return PartnerRequest.findOne({
    status: 'pending',
    $or: [
      { fromUserId: new mongoose.Types.ObjectId(id1), toUserId: new mongoose.Types.ObjectId(id2) },
      { fromUserId: new mongoose.Types.ObjectId(id2), toUserId: new mongoose.Types.ObjectId(id1) }
    ]
  });
};

export const findPendingIncomingRequests = async (userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return [];
  }

  return PartnerRequest.find({
    status: 'pending',
    toUserId: new mongoose.Types.ObjectId(normalizedUserId)
  })
    .sort({ createdAt: -1 })
    .populate('fromUserId', '_id username email firstName lastName avatar');
};

export const findIncomingRequestsForDisplay = async (userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return [];
  }

  return PartnerRequest.find({
    status: { $in: ['pending', 'declined'] },
    toUserId: new mongoose.Types.ObjectId(normalizedUserId)
  })
    .sort({ createdAt: -1 })
    .populate('fromUserId', '_id username email firstName lastName avatar');
};

export const findPendingOutgoingRequests = async (userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return [];
  }

  return PartnerRequest.find({
    status: 'pending',
    fromUserId: new mongoose.Types.ObjectId(normalizedUserId)
  })
    .sort({ createdAt: -1 })
    .populate('toUserId', '_id username email firstName lastName avatar');
};

export const findOutgoingRequestsForDisplay = async (userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId) {
    return [];
  }

  return PartnerRequest.find({
    status: { $in: ['pending', 'declined', 'cancelled'] },
    fromUserId: new mongoose.Types.ObjectId(normalizedUserId)
  })
    .sort({ createdAt: -1 })
    .populate('toUserId', '_id username email firstName lastName avatar');
};

export const supersedePendingRequestsForUsers = async (...userIds: string[]) => {
  const normalizedIds = userIds.map(normalizeIdStr).filter(Boolean) as string[];
  if (normalizedIds.length === 0) {
    return;
  }

  const objectIds = normalizedIds.map((id) => new mongoose.Types.ObjectId(id));

  await PartnerRequest.updateMany(
    {
      status: 'pending',
      $or: [{ fromUserId: { $in: objectIds } }, { toUserId: { $in: objectIds } }]
    },
    { $set: { status: 'superseded' } }
  );
};

export const isRequestRecipient = (
  request: { toUserId: { toString(): string } },
  userId: string
): boolean => idsEqual(request.toUserId, userId);

export const isRequestSender = (
  request: { fromUserId: { toString(): string } },
  userId: string
): boolean => idsEqual(request.fromUserId, userId);

export const getOtherUserIdFromRequest = (
  request: { fromUserId: { toString(): string }; toUserId: { toString(): string } },
  userId: string
): string | null => {
  if (idsEqual(request.fromUserId, userId)) {
    return normalizeIdStr(request.toUserId);
  }
  if (idsEqual(request.toUserId, userId)) {
    return normalizeIdStr(request.fromUserId);
  }
  return null;
};

export const findPendingRequestByIdForUser = async (requestId: string, userId: string) => {
  const normalizedUserId = normalizeIdStr(userId);
  if (!normalizedUserId || !mongoose.Types.ObjectId.isValid(requestId)) {
    return null;
  }

  return PartnerRequest.findOne({
    _id: new mongoose.Types.ObjectId(requestId),
    status: 'pending',
    $or: [
      fieldMatchesUserId('fromUserId', normalizedUserId),
      fieldMatchesUserId('toUserId', normalizedUserId)
    ]
  });
};

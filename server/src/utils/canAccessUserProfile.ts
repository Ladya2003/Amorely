import mongoose from 'mongoose';
import Message from '../models/message';
import { resolvePartnerContext } from './resolvePartnerId';
import { idsEqual, normalizeIdStr } from './normalizeId';

export const canAccessUserProfile = async (
  viewerId: string,
  targetUserId: string
): Promise<boolean> => {
  const viewer = normalizeIdStr(viewerId);
  const target = normalizeIdStr(targetUserId);

  if (!viewer || !target) {
    return false;
  }

  if (idsEqual(viewer, target)) {
    return true;
  }

  const partnerContext = await resolvePartnerContext(viewer);
  if (partnerContext.hasPartner && idsEqual(partnerContext.partnerId, target)) {
    return true;
  }

  const viewerObjectId = new mongoose.Types.ObjectId(viewer);
  const targetObjectId = new mongoose.Types.ObjectId(target);

  const hasDialog = await Message.exists({
    $or: [
      { senderId: viewerObjectId, receiverId: targetObjectId },
      { senderId: targetObjectId, receiverId: viewerObjectId },
    ],
  });

  return Boolean(hasDialog);
};

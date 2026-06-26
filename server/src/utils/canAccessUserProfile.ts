import mongoose from 'mongoose';
import Message from '../models/message';
import { resolvePartnerContext } from './resolvePartnerId';

export const canAccessUserProfile = async (
  viewerId: string,
  targetUserId: string
): Promise<boolean> => {
  if (viewerId === targetUserId) {
    return true;
  }

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return false;
  }

  const partnerContext = await resolvePartnerContext(viewerId);
  if (partnerContext.partnerId === targetUserId) {
    return true;
  }

  const hasDialog = await Message.exists({
    $or: [
      { senderId: viewerId, receiverId: targetUserId },
      { senderId: targetUserId, receiverId: viewerId },
    ],
  });

  return Boolean(hasDialog);
};

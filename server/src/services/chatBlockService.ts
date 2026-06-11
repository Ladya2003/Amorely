import mongoose from 'mongoose';
import ChatBlock from '../models/chatBlock';

export type ChatBlockStatus = {
  isBlocked: boolean;
  blockedByMe: boolean;
  blockedByPeer: boolean;
};

export const getChatBlockStatus = async (
  userId: string,
  contactId: string
): Promise<ChatBlockStatus> => {
  const block = await ChatBlock.findOne({
    $or: [
      { blockerId: userId, blockedUserId: contactId },
      { blockerId: contactId, blockedUserId: userId },
    ],
  }).select('blockerId');

  if (!block) {
    return { isBlocked: false, blockedByMe: false, blockedByPeer: false };
  }

  const blockedByMe = block.blockerId.toString() === userId;
  return {
    isBlocked: true,
    blockedByMe,
    blockedByPeer: !blockedByMe,
  };
};

export const getChatBlockStatusesForContacts = async (
  userId: string,
  contactIds: string[]
): Promise<Map<string, ChatBlockStatus>> => {
  const result = new Map<string, ChatBlockStatus>();

  if (contactIds.length === 0) {
    return result;
  }

  const objectIds = contactIds.map((id) => new mongoose.Types.ObjectId(id));
  const blocks = await ChatBlock.find({
    $or: [
      { blockerId: userId, blockedUserId: { $in: objectIds } },
      { blockerId: { $in: objectIds }, blockedUserId: userId },
    ],
  }).select('blockerId blockedUserId');

  for (const contactId of contactIds) {
    result.set(contactId, { isBlocked: false, blockedByMe: false, blockedByPeer: false });
  }

  for (const block of blocks) {
    const blockerId = block.blockerId.toString();
    const blockedUserId = block.blockedUserId.toString();
    const contactId = blockerId === userId ? blockedUserId : blockerId;
    const blockedByMe = blockerId === userId;

    result.set(contactId, {
      isBlocked: true,
      blockedByMe,
      blockedByPeer: !blockedByMe,
    });
  }

  return result;
};

export const isChatBlockedBetween = async (userId: string, contactId: string): Promise<boolean> => {
  const status = await getChatBlockStatus(userId, contactId);
  return status.isBlocked;
};

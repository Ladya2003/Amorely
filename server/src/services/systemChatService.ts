import mongoose from 'mongoose';
import Message from '../models/message';
import { isChatBlockedBetween } from './chatBlockService';
import { notifyNewMessage } from './pushService';
import { notifySocketUser } from '../socket';
import { ensureSystemUser } from './systemUserService';

const formatSocketMessage = (message: {
  _id: { toString(): string };
  senderId: { toString(): string };
  text?: string | null;
  createdAt: Date;
  editedAt?: Date | null;
  isRead?: boolean;
}) => ({
  id: message._id.toString(),
  senderId: message.senderId.toString(),
  text: message.text || '',
  timestamp: message.createdAt.toISOString(),
  editedAt: message.editedAt ? message.editedAt.toISOString() : undefined,
  isRead: message.isRead,
  attachments: []
});

export const sendSystemChatText = async (recipientId: string, text: string): Promise<boolean> => {
  const trimmed = text.trim();
  if (!recipientId || !trimmed) {
    return false;
  }

  const systemUserId = await ensureSystemUser();
  if (await isChatBlockedBetween(systemUserId, recipientId)) {
    return false;
  }

  const savedMessage = await new Message({
    senderId: new mongoose.Types.ObjectId(systemUserId),
    receiverId: new mongoose.Types.ObjectId(recipientId),
    text: trimmed,
    isRead: false,
    createdAt: new Date()
  }).save();

  notifySocketUser(recipientId, 'new_message', formatSocketMessage(savedMessage));

  void notifyNewMessage({
    receiverId: recipientId,
    senderId: systemUserId,
    text: trimmed,
    pushPreview: trimmed
  });

  return true;
};

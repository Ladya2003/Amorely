import mongoose from 'mongoose';
import Message from '../models/message';
import PlanNote from '../models/planNote';
import User from '../models/user';
import { isChatBlockedBetween } from './chatBlockService';
import { notifyNewMessage } from './pushService';
import { notifySocketUser } from '../socket';
import { ensureSystemUser } from './systemUserService';
import { buildDeadlineReminderText } from '../utils/deadlineReminderText';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Minimum interval between reminders based on time left until deadline. */
export const getMinReminderIntervalMs = (msRemaining: number): number => {
  if (msRemaining <= 6 * HOUR_MS) {
    return 2 * HOUR_MS;
  }
  if (msRemaining <= DAY_MS) {
    return 6 * HOUR_MS;
  }
  if (msRemaining <= 3 * DAY_MS) {
    return 12 * HOUR_MS;
  }
  if (msRemaining <= 7 * DAY_MS) {
    return DAY_MS;
  }
  return 3 * DAY_MS;
};

export const shouldSendDeadlineReminder = (
  deadlineAt: Date,
  lastNotifiedAt: Date | null | undefined,
  now = new Date()
): boolean => {
  const msRemaining = deadlineAt.getTime() - now.getTime();
  if (msRemaining <= 0) {
    return false;
  }

  if (!lastNotifiedAt) {
    return true;
  }

  const minInterval = getMinReminderIntervalMs(msRemaining);
  return now.getTime() - lastNotifiedAt.getTime() >= minInterval;
};

const formatSocketMessage = (message: any) => ({
  id: message._id.toString(),
  senderId: message.senderId.toString(),
  text: message.text,
  timestamp: message.createdAt.toISOString(),
  editedAt: message.editedAt ? message.editedAt.toISOString() : undefined,
  isRead: message.isRead,
  sharedNote: message.sharedNote || undefined,
  attachments: message.attachments?.map((attachment: any) => ({
    type: attachment.type,
    url: attachment.url,
    publicId: attachment.publicId,
    encrypted: Boolean(attachment.encrypted)
  }))
});

const sendSystemDeadlineMessage = async (params: {
  systemUserId: string;
  recipientId: string;
  text: string;
  sharedNote: Record<string, unknown>;
}) => {
  const { systemUserId, recipientId, text, sharedNote } = params;

  if (await isChatBlockedBetween(systemUserId, recipientId)) {
    return false;
  }

  const newMessage = new Message({
    senderId: new mongoose.Types.ObjectId(systemUserId),
    receiverId: new mongoose.Types.ObjectId(recipientId),
    text,
    sharedNote,
    isRead: false,
    createdAt: new Date()
  });

  const savedMessage = await newMessage.save();
  const formattedMessage = formatSocketMessage(savedMessage);

  notifySocketUser(recipientId, 'new_message', formattedMessage);

  void notifyNewMessage({
    receiverId: recipientId,
    senderId: systemUserId,
    text,
    sharedNote: sharedNote as { title?: string },
    pushPreview: text
  });

  return true;
};

export const sendDeadlineRemindersForNote = async (
  note: {
    _id: mongoose.Types.ObjectId;
    deadlineAt?: Date | null;
    deadlineNotifyUserIds?: mongoose.Types.ObjectId[];
    deadlineSharedNoteSnapshot?: Record<string, unknown> | null;
    deadlineLastNotifiedAt?: Date | null;
    completedAt?: Date | null;
  },
  options: { forceInitial?: boolean } = {}
): Promise<number> => {
  if (note.completedAt) {
    return 0;
  }

  if (!note.deadlineAt || !note.deadlineSharedNoteSnapshot) {
    return 0;
  }

  const notifyUserIds = (note.deadlineNotifyUserIds || []).map((id) => id.toString());
  if (notifyUserIds.length === 0) {
    return 0;
  }

  const now = new Date();
  const deadlineAt = new Date(note.deadlineAt);

  if (deadlineAt.getTime() <= now.getTime()) {
    return 0;
  }

  if (
    !options.forceInitial &&
    !shouldSendDeadlineReminder(deadlineAt, note.deadlineLastNotifiedAt, now)
  ) {
    return 0;
  }

  const systemUserId = await ensureSystemUser();
  const msRemaining = deadlineAt.getTime() - now.getTime();
  const sharedNote = {
    ...note.deadlineSharedNoteSnapshot,
    noteId: note._id.toString(),
    updatedAt: now.toISOString()
  };

  let sentCount = 0;

  for (const recipientId of notifyUserIds) {
    const recipient = await User.findById(recipientId).select('locale');
    const text = buildDeadlineReminderText(
      msRemaining,
      recipient?.locale,
      Boolean(options.forceInitial)
    );

    const sent = await sendSystemDeadlineMessage({
      systemUserId,
      recipientId,
      text,
      sharedNote
    });

    if (sent) {
      sentCount += 1;
    }
  }

  if (sentCount > 0) {
    await PlanNote.updateOne({ _id: note._id }, { $set: { deadlineLastNotifiedAt: now } });
  }

  return sentCount;
};

export type DeadlineReminderProcessResult = {
  processedNotes: number;
  sentMessages: number;
  skippedNotes: number;
};

export const processPlanNoteDeadlineReminders = async (): Promise<DeadlineReminderProcessResult> => {
  await ensureSystemUser();

  const now = new Date();
  const notes = await PlanNote.find({
    deadlineAt: { $gt: now },
    completedAt: null,
    deadlineNotifyUserIds: { $exists: true, $not: { $size: 0 } },
    deadlineSharedNoteSnapshot: { $exists: true, $ne: null }
  }).select(
    '_id deadlineAt deadlineNotifyUserIds deadlineSharedNoteSnapshot deadlineLastNotifiedAt completedAt'
  );

  let sentMessages = 0;
  let skippedNotes = 0;

  for (const note of notes) {
    const sent = await sendDeadlineRemindersForNote(note);
    if (sent > 0) {
      sentMessages += sent;
    } else {
      skippedNotes += 1;
    }
  }

  return {
    processedNotes: notes.length,
    sentMessages,
    skippedNotes
  };
};

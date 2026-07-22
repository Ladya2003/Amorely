import { awardCurrency, incrementActivityAndAward, incrementDailyActivityAward, getOrCreateWallet } from '../services/currencyService';
import CurrencyTransaction from '../models/currencyTransaction';
import type { CurrencyReason } from '../models/currencyTransaction';

export const attachCurrencyToResponse = (
  res: { json: (body: object) => void },
  body: object,
  award?: { awarded: boolean; amount: number; balance: number }
) => {
  if (award?.awarded && award.amount > 0) {
    res.json({ ...body, awardedAmount: award.amount, balance: award.balance });
    return;
  }
  res.json(body);
};

export const awardRegistrationBonus = (userId: string) =>
  awardCurrency(userId, 100, 'registration_bonus', `registration_bonus:${userId}`);

export const awardPartnerLinked = (userId: string) =>
  awardCurrency(userId, 50, 'partner_linked', `partner_linked:${userId}`);

export const awardSignature = async (userId: string) => {
  const now = new Date();
  const half = now.getHours() < 12 ? 'am' : 'pm';
  const dateKey = `${now.toISOString().slice(0, 10)}:${half}`;
  return awardCurrency(userId, 15, 'signature', `signature:${userId}:${dateKey}`);
};

export const awardBothSignatures = (relationshipId: string, userId: string) =>
  awardCurrency(userId, 25, 'both_signatures', `both_signatures:${relationshipId}:${userId}`);

export const awardCalendarEvent = (userId: string, eventId: string) =>
  incrementDailyActivityAward(
    userId,
    'calendar_events',
    3,
    5,
    'calendar_event',
    `calendar_event:${userId}:${eventId}`
  );

export const awardPlanNote = (userId: string, noteId: string) =>
  incrementDailyActivityAward(
    userId,
    'plan_notes',
    3,
    3,
    'plan_note',
    `plan_note:${userId}:${noteId}`
  );

export const awardPlanNoteComplete = async (userId: string, noteId: string) => {
  const dateKey = new Date().toISOString().slice(0, 10);
  const idempotencyKey = `plan_note_complete:${userId}:${noteId}:${dateKey}`;
  const existing = await CurrencyTransaction.findOne({ idempotencyKey }).lean();
  if (existing) {
    const { wallet } = await getOrCreateWallet(userId);
    return { awarded: false, amount: 0, balance: wallet.balance };
  }

  return incrementDailyActivityAward(
    userId,
    'plan_notes_complete',
    3,
    3,
    'plan_note_complete',
    idempotencyKey
  );
};

export const awardChatDaily = async (userId: string, messageCountThreshold = 5) => {
  const dateKey = new Date().toISOString().slice(0, 10);
  // Counts all sent messages across any chats for the day (not per conversation).
  return incrementActivityAndAward(
    userId,
    `chat_messages:${dateKey}`,
    messageCountThreshold,
    5,
    'chat_daily',
    `chat_daily:${userId}:${dateKey}`
  );
};

export const awardChatNewContact = (userId: string, contactId: string) =>
  awardCurrency(userId, 10, 'chat_new_contact', `chat_new_contact:${userId}:${contactId}`);

export const awardGameRound = (userId: string, gameId: string, roundKey: string) =>
  awardCurrency(userId, 3, 'game_round', `game_round:${userId}:${gameId}:${roundKey}`);

export const awardGameDailyComplete = (userId: string, gameId: string, dayKey: string, amount: number) =>
  awardCurrency(userId, amount, 'game_round', `game_daily_complete:${userId}:${gameId}:${dayKey}`);

export const awardGameMedal = (userId: string, gameId: string) => {
  const dateKey = new Date().toISOString().slice(0, 10);
  return awardCurrency(userId, 20, 'game_medal', `game_medal:${userId}:${gameId}:${dateKey}`);
};

export const awardProfileField = (userId: string, field: string) => {
  const reasonMap: Record<string, CurrencyReason> = {
    avatar: 'profile_avatar',
    firstName: 'profile_firstName',
    lastName: 'profile_lastName',
    birthday: 'profile_birthday',
    bio: 'profile_bio',
  };
  const reason = reasonMap[field] ?? 'profile_bio';
  return awardCurrency(userId, field === 'avatar' ? 10 : 5, reason, `profile_${field}:${userId}`);
};

export const awardSettingsField = (userId: string, field: string) => {
  const reasonMap: Record<string, CurrencyReason> = {
    theme: 'settings_theme',
    primaryColor: 'settings_primaryColor',
    notifications: 'settings_notifications',
  };
  const reason = reasonMap[field] ?? 'settings_theme';
  return awardCurrency(userId, 5, reason, `settings_${field}:${userId}`);
};

export const awardPushEnabled = (userId: string) =>
  awardCurrency(userId, 50, 'settings_push', `settings_push:${userId}`);

export const awardFeedNewSlot = (userId: string, contentId: string) =>
  awardCurrency(userId, 5, 'feed_new_slot', `feed_new_slot:${userId}:${contentId}`);

export const awardNewsRead = (userId: string, newsId: string) =>
  awardCurrency(userId, 5, 'news_read', `news_read:${userId}:${newsId}`);

export const awardAnnouncementRead = (userId: string, announcementKey: string) =>
  awardCurrency(userId, 3, 'announcement_read', `announcement_read:${userId}:${announcementKey}`);

/** Завершение категории «Вопросы дня» — до 2 категорий в день (20 Аморок). */
export const awardDailyQuestionCategory = (userId: string, roundKey: string, categoryId: string) =>
  incrementDailyActivityAward(
    userId,
    'daily_question_categories',
    2,
    10,
    'daily_question_category',
    `daily_question_category:${userId}:${roundKey}:${categoryId}`
  );

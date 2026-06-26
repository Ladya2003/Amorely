import mongoose from 'mongoose';

export const CURRENCY_REASONS = [
  'registration_bonus',
  'feed_new_slot',
  'partner_linked',
  'days_achievement',
  'signature',
  'both_signatures',
  'days_theme',
  'days_export',
  'days_bg',
  'chat_daily',
  'chat_new_contact',
  'game_round',
  'game_medal',
  'game_medal_stipend',
  'calendar_event',
  'plan_note',
  'plan_note_complete',
  'profile_avatar',
  'profile_firstName',
  'profile_lastName',
  'profile_birthday',
  'profile_bio',
  'settings_theme',
  'settings_primaryColor',
  'settings_notifications',
  'settings_push',
  'news_read',
  'pet_purchase',
  'pet_level_up',
  'pet_petting',
  'manual_claim',
] as const;

export type CurrencyReason = (typeof CURRENCY_REASONS)[number];

const currencyTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  reason: { type: String, enum: CURRENCY_REASONS, required: true },
  idempotencyKey: { type: String, required: true, unique: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('CurrencyTransaction', currencyTransactionSchema);

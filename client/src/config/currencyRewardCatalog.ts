export type CurrencyGuideSection =
  | 'welcome'
  | 'relationship'
  | 'daysTogether'
  | 'chat'
  | 'games'
  | 'calendar'
  | 'profile'
  | 'settings'
  | 'news';

export interface CurrencyEarnRule {
  id: string;
  section: CurrencyGuideSection;
  amount: number;
}

export const CURRENCY_GUIDE_SECTIONS: CurrencyGuideSection[] = [
  'welcome',
  'relationship',
  'daysTogether',
  'chat',
  'games',
  'calendar',
  'news',
  'profile',
  'settings',
];

/** Mirrors server-side earn rules that are currently active in the app. */
export const CURRENCY_EARN_RULES: CurrencyEarnRule[] = [
  { id: 'registration_bonus', section: 'welcome', amount: 100 },
  { id: 'partner_linked', section: 'relationship', amount: 50 },
  { id: 'signature', section: 'daysTogether', amount: 15 },
  { id: 'both_signatures', section: 'daysTogether', amount: 25 },
  { id: 'days_theme', section: 'daysTogether', amount: 5 },
  { id: 'days_export', section: 'daysTogether', amount: 5 },
  { id: 'chat_daily', section: 'chat', amount: 5 },
  { id: 'chat_new_contact', section: 'chat', amount: 10 },
  { id: 'game_round_tap', section: 'games', amount: 3 },
  { id: 'game_daily_geo', section: 'games', amount: 15 },
  { id: 'game_daily_draw', section: 'games', amount: 30 },
  { id: 'game_daily_quiz', section: 'games', amount: 45 },
  { id: 'game_medal_stipend_1', section: 'games', amount: 25 },
  { id: 'game_medal_stipend_2', section: 'games', amount: 15 },
  { id: 'game_medal_stipend_3', section: 'games', amount: 10 },
  { id: 'calendar_event', section: 'calendar', amount: 5 },
  { id: 'plan_note', section: 'calendar', amount: 3 },
  { id: 'plan_note_complete', section: 'calendar', amount: 3 },
  { id: 'profile_avatar', section: 'profile', amount: 10 },
  { id: 'profile_firstName', section: 'profile', amount: 5 },
  { id: 'profile_lastName', section: 'profile', amount: 5 },
  { id: 'profile_birthday', section: 'profile', amount: 5 },
  { id: 'profile_bio', section: 'profile', amount: 5 },
  { id: 'settings_theme', section: 'settings', amount: 5 },
  { id: 'settings_primaryColor', section: 'settings', amount: 5 },
  { id: 'settings_notifications', section: 'settings', amount: 5 },
  { id: 'settings_push', section: 'settings', amount: 50 },
  { id: 'news_read', section: 'news', amount: 5 },
];

import type { TFunction } from 'i18next';
import { formatChatContactPresence } from '../localization/chatHelpers';

export const formatContactPresence = (
  isOnline: boolean | undefined,
  lastSeen: string | null | undefined,
  t: TFunction,
  locale?: string | null
): string => formatChatContactPresence(t, isOnline, lastSeen, locale);

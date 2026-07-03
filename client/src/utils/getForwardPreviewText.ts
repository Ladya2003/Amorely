import type { TFunction } from 'i18next';
import type { MessageType } from '../components/Chat/ChatDialog';
import { getChatMessagePreview } from '../localization/chatHelpers';

export const getForwardPreviewText = (
  t: TFunction,
  message: Pick<MessageType, 'text' | 'attachments' | 'sharedEvent' | 'sharedNote' | 'sharedGame' | 'forwardFrom'>
): string => {
  const trimmedText = message.text?.trim();
  if (trimmedText) return trimmedText;
  if (message.forwardFrom?.text?.trim()) return message.forwardFrom.text.trim();
  return getChatMessagePreview(t, message);
};

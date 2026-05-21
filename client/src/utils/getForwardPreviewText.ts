import type { MessageType } from '../components/Chat/ChatDialog';

export const getForwardPreviewText = (
  message: Pick<MessageType, 'text' | 'attachments' | 'sharedEvent' | 'forwardFrom'>
): string => {
  const trimmedText = message.text?.trim();
  if (trimmedText) return trimmedText;
  if (message.sharedEvent?.title) return `Событие: ${message.sharedEvent.title}`;
  if (message.attachments?.length) return 'Медиафайл';
  if (message.forwardFrom?.text?.trim()) return message.forwardFrom.text.trim();
  return 'Пересланное сообщение';
};

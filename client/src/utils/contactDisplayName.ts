export const getContactDisplayName = (
  contact: {
    name: string;
    role?: string;
  },
  systemMessagesLabel: string
): string => (contact.role === 'system' ? systemMessagesLabel : contact.name);

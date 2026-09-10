export const isSystemContact = (contact: { role?: string }): boolean =>
  contact.role === 'system';

export const getContactDisplayName = (
  contact: {
    name: string;
    role?: string;
  },
  systemMessagesLabel: string
): string => (isSystemContact(contact) ? systemMessagesLabel : contact.name);

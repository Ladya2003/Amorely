const connectedUserIds = new Set<string>();

export const markUserOnline = (userId: string): void => {
  connectedUserIds.add(userId);
};

export const markUserOffline = (userId: string): void => {
  connectedUserIds.delete(userId);
};

export const isUserOnline = (userId: string): boolean => {
  return connectedUserIds.has(userId);
};

export const getOnlineUserIds = (): string[] => {
  return Array.from(connectedUserIds);
};

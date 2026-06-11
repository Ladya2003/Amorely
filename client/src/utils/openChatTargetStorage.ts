export type StoredOpenChatTarget = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
};

export const getOpenChatTargetStorageKey = (userId: string) =>
  `amorely.openChatTarget:${userId}`;

export const saveOpenChatTarget = (userId: string, target: StoredOpenChatTarget) => {
  if (!userId) {
    return;
  }
  localStorage.setItem(getOpenChatTargetStorageKey(userId), JSON.stringify(target));
};

export const readOpenChatTarget = (userId: string): StoredOpenChatTarget | null => {
  if (!userId) {
    return null;
  }

  try {
    const raw = localStorage.getItem(getOpenChatTargetStorageKey(userId));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredOpenChatTarget;
  } catch {
    return null;
  }
};

export const clearOpenChatTarget = (userId: string) => {
  if (!userId) {
    return;
  }
  localStorage.removeItem(getOpenChatTargetStorageKey(userId));
};

const STORAGE_VERSION = 1;

export function getReadAnnouncementsStorageKey(userId: string): string {
  return `amorely.readAnnouncements.v${STORAGE_VERSION}.${userId}`;
}

export function readReadAnnouncementKeys(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getReadAnnouncementsStorageKey(userId));
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((key): key is string => typeof key === 'string'));
  } catch {
    return new Set();
  }
}

export function saveReadAnnouncementKeys(userId: string, keys: Set<string>): void {
  localStorage.setItem(getReadAnnouncementsStorageKey(userId), JSON.stringify(Array.from(keys)));
}

export function addReadAnnouncementKey(userId: string, announcementKey: string): Set<string> {
  const keys = readReadAnnouncementKeys(userId);
  keys.add(announcementKey);
  saveReadAnnouncementKeys(userId, keys);
  return keys;
}

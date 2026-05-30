const STORAGE_VERSION = 1;

export function getReadNewsStorageKey(userId: string): string {
  return `amorely.readNews.v${STORAGE_VERSION}.${userId}`;
}

export function readReadNewsIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getReadNewsStorageKey(userId));
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function saveReadNewsIds(userId: string, ids: Set<string>): void {
  localStorage.setItem(getReadNewsStorageKey(userId), JSON.stringify(Array.from(ids)));
}

export function addReadNewsId(userId: string, newsId: string): Set<string> {
  const ids = readReadNewsIds(userId);
  ids.add(newsId);
  saveReadNewsIds(userId, ids);
  return ids;
}

const DB_NAME = 'amorely-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'event-draft-media';
const DRAFT_MEDIA_KEY = 'calendar_event_draft_files';

interface StoredDraftMediaItem {
  name: string;
  type: string;
  lastModified: number;
  data: Blob;
}

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });

const withStore = async <T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>
): Promise<T> => {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, mode);
  const store = tx.objectStore(STORE_NAME);
  try {
    const result = await operation(store);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return result;
  } finally {
    db.close();
  }
};

export const saveEventDraftMedia = async (files: File[]): Promise<void> => {
  const items: StoredDraftMediaItem[] = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      data: file
    }))
  );

  await withStore('readwrite', (store) => {
    store.put(items, DRAFT_MEDIA_KEY);
    return Promise.resolve();
  });
};

export const loadEventDraftMedia = async (): Promise<File[]> => {
  const items = await withStore('readonly', (store) =>
    new Promise<StoredDraftMediaItem[] | null>((resolve, reject) => {
      const request = store.get(DRAFT_MEDIA_KEY);
      request.onsuccess = () => resolve((request.result as StoredDraftMediaItem[]) ?? null);
      request.onerror = () => reject(request.error);
    })
  );

  if (!items || items.length === 0) return [];

  return items.map(
    (item) =>
      new File([item.data], item.name, {
        type: item.type,
        lastModified: item.lastModified
      })
  );
};

export const clearEventDraftMedia = async (): Promise<void> => {
  await withStore('readwrite', (store) => {
    store.delete(DRAFT_MEDIA_KEY);
    return Promise.resolve();
  });
};

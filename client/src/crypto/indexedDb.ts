const DB_NAME = 'amorely-e2ee';
const DB_VERSION = 1;
const STORE_NAME = 'crypto-store';

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

export const setStoredValue = async <T>(key: string, value: T): Promise<void> => {
  await withStore('readwrite', (store) => {
    store.put(value, key);
    return Promise.resolve();
  });
};

export const getStoredValue = async <T>(key: string): Promise<T | null> =>
  withStore('readonly', (store) =>
    new Promise<T | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => reject(request.error);
    })
  );

export const removeStoredValue = async (key: string): Promise<void> => {
  await withStore('readwrite', (store) => {
    store.delete(key);
    return Promise.resolve();
  });
};

export const clearCryptoStore = async (): Promise<void> => {
  await withStore('readwrite', (store) => {
    store.clear();
    return Promise.resolve();
  });
};

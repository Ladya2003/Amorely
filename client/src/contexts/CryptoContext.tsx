import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import {
  LocalDeviceKeys,
  generateRecoveryPhrase,
  hasLocalKeys,
  initializeCryptoForUser,
  loadLocalKeys,
  removeLocalKeys,
  restoreFromBackup,
  saveEncryptedBackup
} from '../crypto/cryptoService';

interface CryptoContextValue {
  isCryptoReady: boolean;
  isChecking: boolean;
  /** true после первой попытки загрузки ключей для текущего userId (или если пользователь ещё не нужен) */
  isCryptoBootstrapComplete: boolean;
  localDeviceKeys: LocalDeviceKeys | null;
  ensureLocalKeys: () => Promise<void>;
  createAndBackupKeys: (passphrase: string) => Promise<LocalDeviceKeys>;
  restoreKeysFromPassphrase: (passphrase: string) => Promise<LocalDeviceKeys>;
  clearLocalKeys: () => Promise<void>;
  generateSuggestedPassphrase: () => string;
}

const CryptoContext = createContext<CryptoContextValue>({
  isCryptoReady: false,
  isChecking: false,
  isCryptoBootstrapComplete: false,
  localDeviceKeys: null,
  ensureLocalKeys: async () => {},
  createAndBackupKeys: async () => {
    throw new Error('CryptoContext not initialized');
  },
  restoreKeysFromPassphrase: async () => {
    throw new Error('CryptoContext not initialized');
  },
  clearLocalKeys: async () => {},
  generateSuggestedPassphrase: () => ''
});

export const useCrypto = () => useContext(CryptoContext);

export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [localDeviceKeys, setLocalDeviceKeys] = useState<LocalDeviceKeys | null>(null);
  const [cryptoResolvedUserId, setCryptoResolvedUserId] = useState<string | null>(null);

  const userId = user?._id || null;

  const reloadKeysForUser = useCallback(
    async (uid: string) => {
      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      const exists = await hasLocalKeys(uid);
      if (!exists) {
        setLocalDeviceKeys(null);
        return;
      }
      const loaded = await loadLocalKeys(uid);
      setLocalDeviceKeys(loaded);
    },
    [token]
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setLocalDeviceKeys(null);
      setCryptoResolvedUserId(null);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    const uid = userId;

    setIsChecking(true);

    void reloadKeysForUser(uid)
      .catch(() => {
        if (!cancelled) {
          setLocalDeviceKeys(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsChecking(false);
          setCryptoResolvedUserId(uid);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reloadKeysForUser, userId]);

  const ensureLocalKeys = useCallback(async () => {
    if (!userId || !isAuthenticated) {
      setLocalDeviceKeys(null);
      return;
    }

    setIsChecking(true);
    try {
      await reloadKeysForUser(userId);
    } catch {
      setLocalDeviceKeys(null);
    } finally {
      setIsChecking(false);
      setCryptoResolvedUserId(userId);
    }
  }, [isAuthenticated, reloadKeysForUser, userId]);

  const isCryptoBootstrapComplete =
    !isAuthenticated || !userId || cryptoResolvedUserId === userId;

  const createAndBackupKeys = useCallback(
    async (passphrase: string) => {
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }

      const keys = await initializeCryptoForUser(userId);
      await saveEncryptedBackup(keys, passphrase);
      setLocalDeviceKeys(keys);
      return keys;
    },
    [userId]
  );

  const restoreKeysFromPassphrase = useCallback(
    async (passphrase: string) => {
      if (!userId) {
        throw new Error('Пользователь не авторизован');
      }
      const restored = await restoreFromBackup(userId, passphrase);
      setLocalDeviceKeys(restored);
      return restored;
    },
    [userId]
  );

  const clearLocalKeys = useCallback(async () => {
    if (!userId) return;
    await removeLocalKeys(userId);
    setLocalDeviceKeys(null);
  }, [userId]);

  const value = useMemo<CryptoContextValue>(
    () => ({
      isCryptoReady: Boolean(localDeviceKeys),
      isChecking,
      isCryptoBootstrapComplete,
      localDeviceKeys,
      ensureLocalKeys,
      createAndBackupKeys,
      restoreKeysFromPassphrase,
      clearLocalKeys,
      generateSuggestedPassphrase: () => generateRecoveryPhrase(12)
    }),
    [
      clearLocalKeys,
      createAndBackupKeys,
      ensureLocalKeys,
      isChecking,
      isCryptoBootstrapComplete,
      localDeviceKeys,
      restoreKeysFromPassphrase
    ]
  );

  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
};

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useCrypto } from './CryptoContext';
import { fetchFeedHome, type FeedHomePayload } from '../services/feedHomeService';

interface FeedHomeContextValue {
  data: FeedHomePayload | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const FeedHomeContext = createContext<FeedHomeContextValue | null>(null);

export const useOptionalFeedHome = () => useContext(FeedHomeContext);

export const useFeedHome = (): FeedHomeContextValue => {
  const value = useContext(FeedHomeContext);
  if (!value) {
    throw new Error('useFeedHome must be used within FeedHomeProvider');
  }
  return value;
};

export const FeedHomeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const { isCryptoBootstrapComplete } = useCrypto();
  const [data, setData] = useState<FeedHomePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      const payload = await fetchFeedHome(i18n.language);
      setData(payload);
    } catch (error) {
      console.error('Ошибка при загрузке домашней ленты:', error);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    if (!isCryptoBootstrapComplete) {
      return;
    }
    setLoading(true);
    void refresh();
  }, [isCryptoBootstrapComplete, refresh]);

  const value = useMemo(
    () => ({ data, loading, refresh }),
    [data, loading, refresh]
  );

  return <FeedHomeContext.Provider value={value}>{children}</FeedHomeContext.Provider>;
};

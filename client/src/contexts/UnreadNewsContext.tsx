import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from './AuthContext';
import { claimNewsReadReward, fetchReadNewsIds, syncReadNewsIds } from '../services/newsService';
import { addReadNewsId, mergeReadNewsIds, readReadNewsIds } from '../utils/readNewsStorage';

interface UnreadNewsContextType {
  unreadCount: number;
  isNewsUnread: (newsId: string) => boolean;
  markNewsAsRead: (newsId: string) => void;
  refreshUnreadNews: () => Promise<void>;
  syncNewsIds: (newsIds: string[]) => void;
}

const UnreadNewsContext = createContext<UnreadNewsContextType>({
  unreadCount: 0,
  isNewsUnread: () => false,
  markNewsAsRead: () => {},
  refreshUnreadNews: async () => {},
  syncNewsIds: () => {},
});

export const useUnreadNews = () => useContext(UnreadNewsContext);

interface UnreadNewsProviderProps {
  children: ReactNode;
}

export const UnreadNewsProvider: React.FC<UnreadNewsProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?._id ?? null;

  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [allNewsIds, setAllNewsIds] = useState<string[]>([]);

  const applyReadIds = useCallback(
    (ids: string[]) => {
      if (!userId) {
        return new Set<string>();
      }

      const next = mergeReadNewsIds(userId, ids);
      setReadIds(new Set(next));
      return next;
    },
    [userId]
  );

  const syncReadStateFromAccount = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const serverIds = await fetchReadNewsIds();
      const localIds = Array.from(readReadNewsIds(userId));
      const localOnly = localIds.filter((id) => !serverIds.includes(id));

      if (localOnly.length > 0) {
        const merged = await syncReadNewsIds(localOnly);
        applyReadIds(merged);
        return;
      }

      applyReadIds(serverIds);
    } catch (error) {
      console.error('Ошибка при синхронизации прочитанных новостей:', error);
    }
  }, [userId, applyReadIds]);

  useEffect(() => {
    if (!userId) {
      setReadIds(new Set());
      setAllNewsIds([]);
      return;
    }

    setReadIds(readReadNewsIds(userId));
    void syncReadStateFromAccount();
  }, [userId, syncReadStateFromAccount]);

  const refreshUnreadNews = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAllNewsIds([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/news`, {
        params: { page: 1, limit: 50 },
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = response.data.news as Array<{ _id: string; isRead?: boolean }>;
      setAllNewsIds(items.map((item) => item._id));
      applyReadIds(items.filter((item) => item.isRead).map((item) => item._id));
    } catch (error) {
      console.error('Ошибка при загрузке списка новостей для счётчика:', error);
    }
  }, [applyReadIds]);

  const syncNewsIds = useCallback((newsIds: string[]) => {
    setAllNewsIds(newsIds);
  }, []);

  const markNewsAsRead = useCallback(
    (newsId: string) => {
      if (!userId || readIds.has(newsId)) {
        return;
      }

      const next = addReadNewsId(userId, newsId);
      setReadIds(new Set(next));

      void claimNewsReadReward(newsId)
        .then((result) => {
          if (result.readIds) {
            applyReadIds(result.readIds);
          }
        })
        .catch(() => {
          // Persist is best-effort; local cache already updated.
        });
    },
    [userId, readIds, applyReadIds]
  );

  const isNewsUnread = useCallback(
    (newsId: string) => !readIds.has(newsId),
    [readIds]
  );

  const unreadCount = useMemo(
    () => allNewsIds.filter((id) => !readIds.has(id)).length,
    [allNewsIds, readIds]
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    void refreshUnreadNews();
  }, [isAuthenticated, userId, refreshUnreadNews]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshUnreadNews();
        void syncReadStateFromAccount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, userId, refreshUnreadNews, syncReadStateFromAccount]);

  const value = useMemo(
    () => ({
      unreadCount,
      isNewsUnread,
      markNewsAsRead,
      refreshUnreadNews,
      syncNewsIds,
    }),
    [unreadCount, isNewsUnread, markNewsAsRead, refreshUnreadNews, syncNewsIds]
  );

  return (
    <UnreadNewsContext.Provider value={value}>
      {children}
    </UnreadNewsContext.Provider>
  );
};

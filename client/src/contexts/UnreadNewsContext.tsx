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
import { addReadNewsId, readReadNewsIds } from '../utils/readNewsStorage';

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

  useEffect(() => {
    if (!userId) {
      setReadIds(new Set());
      setAllNewsIds([]);
      return;
    }

    setReadIds(readReadNewsIds(userId));
  }, [userId]);

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
      const ids = (response.data.news as Array<{ _id: string }>).map((item) => item._id);
      setAllNewsIds(ids);
    } catch (error) {
      console.error('Ошибка при загрузке списка новостей для счётчика:', error);
    }
  }, []);

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
    },
    [userId, readIds]
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

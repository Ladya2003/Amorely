import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode
} from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';

interface UnreadMessagesContextType {
  totalUnreadCount: number;
  otherUnreadCount: number;
  activeContactId: string | null;
  setActiveContactId: (contactId: string | null) => void;
  refreshUnreadCount: () => Promise<void>;
  syncUnreadFromContacts: (contacts: Array<{ id: string; unreadCount?: number }>) => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  totalUnreadCount: 0,
  otherUnreadCount: 0,
  activeContactId: null,
  setActiveContactId: () => {},
  refreshUnreadCount: async () => {},
  syncUnreadFromContacts: () => {}
});

export const useUnreadMessages = () => useContext(UnreadMessagesContext);

const sumUnread = (unreadByContact: Record<string, number>, excludeId?: string | null) =>
  Object.entries(unreadByContact).reduce((sum, [id, count]) => {
    if (excludeId && id === excludeId) {
      return sum;
    }
    return sum + (count || 0);
  }, 0);

interface UnreadMessagesProviderProps {
  children: ReactNode;
}

export const UnreadMessagesProvider: React.FC<UnreadMessagesProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const userId = user?._id ?? null;

  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({});
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  const totalUnreadCount = useMemo(() => sumUnread(unreadByContact), [unreadByContact]);
  const otherUnreadCount = useMemo(
    () => sumUnread(unreadByContact, activeContactId),
    [unreadByContact, activeContactId]
  );

  const refreshUnreadCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUnreadByContact({});
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nextUnread: Record<string, number> = {};
      (response.data as Array<{ id: string; unreadCount?: number }>).forEach((contact) => {
        nextUnread[contact.id] = contact.unreadCount || 0;
      });
      setUnreadByContact(nextUnread);
    } catch (error) {
      console.error('Ошибка при загрузке непрочитанных сообщений:', error);
    }
  }, []);

  const syncUnreadFromContacts = useCallback((contacts: Array<{ id: string; unreadCount?: number }>) => {
    const nextUnread: Record<string, number> = {};
    contacts.forEach((contact) => {
      nextUnread[contact.id] = contact.unreadCount || 0;
    });
    setUnreadByContact(nextUnread);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      socketService.disconnect();
      setUnreadByContact({});
      setActiveContactId(null);
      return;
    }

    void refreshUnreadCount();
  }, [isAuthenticated, userId, refreshUnreadCount]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const socket = socketService.initialize(userId);

    const onNewMessage = (message: { senderId: string }) => {
      if (location.pathname === '/chat') {
        return;
      }

      setUnreadByContact((prev) => ({
        ...prev,
        [message.senderId]: (prev[message.senderId] || 0) + 1
      }));
    };

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
    };
  }, [userId, location.pathname]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (location.pathname === '/chat') {
      void refreshUnreadCount();
    }
  }, [userId, location.pathname, refreshUnreadCount]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [userId, refreshUnreadCount]);

  const value = useMemo(
    () => ({
      totalUnreadCount,
      otherUnreadCount,
      activeContactId,
      setActiveContactId,
      refreshUnreadCount,
      syncUnreadFromContacts
    }),
    [
      totalUnreadCount,
      otherUnreadCount,
      activeContactId,
      refreshUnreadCount,
      syncUnreadFromContacts
    ]
  );

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

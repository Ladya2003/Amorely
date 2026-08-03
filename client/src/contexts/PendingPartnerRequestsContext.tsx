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
import {
  PARTNER_REQUESTS_CHANGED_EVENT,
  type IncomingPartnerRequestItem,
} from '../hooks/usePartnerRequests';

interface PendingPartnerRequestsContextType {
  pendingIncomingCount: number;
  refreshPendingIncomingCount: () => Promise<void>;
}

const PendingPartnerRequestsContext = createContext<PendingPartnerRequestsContextType>({
  pendingIncomingCount: 0,
  refreshPendingIncomingCount: async () => {},
});

export const usePendingPartnerRequests = () => useContext(PendingPartnerRequestsContext);

interface PendingPartnerRequestsProviderProps {
  children: ReactNode;
}

export const PendingPartnerRequestsProvider: React.FC<PendingPartnerRequestsProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated, token } = useAuth();
  const userId = user?._id ?? null;
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);

  const refreshPendingIncomingCount = useCallback(async () => {
    if (!token) {
      setPendingIncomingCount(0);
      return;
    }

    try {
      const response = await axios.get<IncomingPartnerRequestItem[]>(
        `${API_URL}/api/relationships/requests/incoming`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const count = response.data.filter((request) => request.status === 'pending').length;
      setPendingIncomingCount(count);
    } catch (error) {
      console.error('Ошибка при загрузке счётчика заявок на партнёрство:', error);
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setPendingIncomingCount(0);
      return;
    }

    void refreshPendingIncomingCount();
  }, [isAuthenticated, userId, refreshPendingIncomingCount]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      return;
    }

    const handleRefresh = () => {
      void refreshPendingIncomingCount();
    };

    window.addEventListener(PARTNER_REQUESTS_CHANGED_EVENT, handleRefresh);
    window.addEventListener('focus', handleRefresh);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshPendingIncomingCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener(PARTNER_REQUESTS_CHANGED_EVENT, handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, userId, refreshPendingIncomingCount]);

  const value = useMemo(
    () => ({
      pendingIncomingCount,
      refreshPendingIncomingCount,
    }),
    [pendingIncomingCount, refreshPendingIncomingCount]
  );

  return (
    <PendingPartnerRequestsContext.Provider value={value}>
      {children}
    </PendingPartnerRequestsContext.Provider>
  );
};

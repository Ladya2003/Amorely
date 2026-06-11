import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  clearAdminFeedAlerts,
  clearAdminModerationTabAlerts,
  clearAdminUsersTabAlerts,
  fetchAdminAlerts,
  type AdminAlertsState,
} from '../services/adminService';

type AdminAlertsContextValue = AdminAlertsState & {
  refreshAdminAlerts: () => Promise<void>;
  clearFeedDot: () => Promise<void>;
  clearUsersTabBadge: () => Promise<void>;
  clearModerationTabBadge: () => Promise<void>;
};

const defaultState: AdminAlertsState = {
  feedDot: false,
  newUsersCount: 0,
  newReportsCount: 0,
};

const AdminAlertsContext = createContext<AdminAlertsContextValue>({
  ...defaultState,
  refreshAdminAlerts: async () => {},
  clearFeedDot: async () => {},
  clearUsersTabBadge: async () => {},
  clearModerationTabBadge: async () => {},
});

export const useAdminAlerts = () => useContext(AdminAlertsContext);

export const AdminAlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === 'admin';
  const [alerts, setAlerts] = useState<AdminAlertsState>(defaultState);

  const refreshAdminAlerts = useCallback(async () => {
    if (!isAdmin) {
      setAlerts(defaultState);
      return;
    }

    try {
      const data = await fetchAdminAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Ошибка загрузки админ-индикаторов:', error);
    }
  }, [isAdmin]);

  const clearFeedDot = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    try {
      await clearAdminFeedAlerts();
      setAlerts((prev) => ({ ...prev, feedDot: false }));
    } catch (error) {
      console.error('Ошибка сброса индикатора ленты:', error);
    }
  }, [isAdmin]);

  const clearUsersTabBadge = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    try {
      await clearAdminUsersTabAlerts();
      setAlerts((prev) => ({ ...prev, newUsersCount: 0 }));
    } catch (error) {
      console.error('Ошибка сброса индикатора пользователей:', error);
    }
  }, [isAdmin]);

  const clearModerationTabBadge = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    try {
      await clearAdminModerationTabAlerts();
      setAlerts((prev) => ({ ...prev, newReportsCount: 0 }));
    } catch (error) {
      console.error('Ошибка сброса индикатора модерации:', error);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setAlerts(defaultState);
      return undefined;
    }

    void refreshAdminAlerts();

    const intervalId = window.setInterval(() => {
      void refreshAdminAlerts();
    }, 60000);

    const handleFocus = () => {
      void refreshAdminAlerts();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isAdmin, refreshAdminAlerts]);

  const value = useMemo(
    () => ({
      ...alerts,
      refreshAdminAlerts,
      clearFeedDot,
      clearUsersTabBadge,
      clearModerationTabBadge,
    }),
    [alerts, refreshAdminAlerts, clearFeedDot, clearUsersTabBadge, clearModerationTabBadge]
  );

  return (
    <AdminAlertsContext.Provider value={value}>
      {children}
    </AdminAlertsContext.Provider>
  );
};

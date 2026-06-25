import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios, { AxiosResponse } from 'axios';
import {
  getAccountBlockedPayload,
  resolveBlockReasonForLocale,
  type BlockReasonsMap,
} from '../utils/handleAccountBlocked';
import { API_URL } from '../config';
import {
  hasAnyPushSettingEnabled,
  isPushSupported,
  registerServiceWorker,
  subscribeToPush
} from '../services/pushNotifications';
import i18next from '../localization';
import { resolveAppLocale } from '../localization/locale';
import { applyPreferredLocale } from '../localization/localeSync';
import socketService from '../services/socketService';
import { notifyPartnerChanged, notifyPartnerUnlinked } from '../hooks/useRelationship';
import { notifyPartnerRequestsChanged } from '../hooks/usePartnerRequests';
import { notifyCalendarEventsChanged } from '../hooks/useCalendarEvents';

interface User {
  _id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  birthday?: string;
  relationshipStartDate?: string;
  partnerId?: string;
  theme?: 'light' | 'dark' | 'system';
  primaryColor?: 'pink' | 'purple' | 'blue' | 'orange' | 'dark-red' | 'dark-green';
  displayBadgeGameId?: string | null;
  role?: 'user' | 'admin';
  locale?: string;
  hasCryptoBackup?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AxiosResponse<any, any> | undefined>;
  register: (email: string, username: string, password: string) => Promise<AxiosResponse<any, any> | undefined>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: User) => void;
  blockReasons: BlockReasonsMap | null;
  blockReasonFallback: string | null;
  clearBlockNotice: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => undefined,
  register: async () => undefined,
  logout: () => {},
  clearError: () => {},
  updateUser: () => {},
  blockReasons: null,
  blockReasonFallback: null,
  clearBlockNotice: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [blockReasons, setBlockReasons] = useState<BlockReasonsMap | null>(null);
  const [blockReasonFallback, setBlockReasonFallback] = useState<string | null>(null);
  const performLogout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    socketService.disconnect();
  }, []);

  const handleBlockedResponse = useCallback((payload: ReturnType<typeof getAccountBlockedPayload>) => {
    if (payload) {
      setBlockReasons(payload.blockedReasons ?? null);
      setBlockReasonFallback(payload.blockReason ?? null);
      setError(
        resolveBlockReasonForLocale(
          payload.blockedReasons,
          resolveAppLocale(i18next.language),
          payload.blockReason
        ) || payload.blockReason || null
      );
    }
    performLogout();
  }, [performLogout]);

  const clearBlockNotice = useCallback(() => {
    setBlockReasons(null);
    setBlockReasonFallback(null);
  }, []);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (requestError) => {
        const blockedPayload = getAccountBlockedPayload(requestError);
        if (blockedPayload) {
          handleBlockedResponse(blockedPayload);
        }
        return Promise.reject(requestError);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [handleBlockedResponse]);

  // Проверяем токен при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get(`${API_URL}/api/auth/me`);
          const preferredLocale = await applyPreferredLocale(response.data?.locale, {
            userId: response.data?._id,
            token,
          });
          setUser({ ...response.data, locale: preferredLocale });
          setIsAuthenticated(true);

          if (
            isPushSupported() &&
            Notification.permission === 'granted' &&
            hasAnyPushSettingEnabled(response.data.notificationSettings)
          ) {
            void registerServiceWorker().then(() => subscribeToPush(token));
          }
        } catch (authError) {
          console.error('Ошибка аутентификации:', authError);
          const blockedPayload = getAccountBlockedPayload(authError);
          if (blockedPayload) {
            handleBlockedResponse(blockedPayload);
          } else {
            performLogout();
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token, handleBlockedResponse, performLogout]);

  useEffect(() => {
    if (!user?._id || !token) {
      return;
    }

    const refreshUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`);
        setUser(response.data);
      } catch (refreshError) {
        console.error('Ошибка при обновлении профиля:', refreshError);
        const blockedPayload = getAccountBlockedPayload(refreshError);
        if (blockedPayload) {
          handleBlockedResponse(blockedPayload);
        }
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        void refreshUser();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    const socket = socketService.initialize(user._id);
    const handlePartnerLinked = () => {
      void refreshUser().finally(() => {
        notifyPartnerChanged();
      });
    };
    const handlePartnerUnlinked = () => {
      void refreshUser().finally(() => {
        notifyPartnerChanged();
        notifyPartnerUnlinked();
        notifyCalendarEventsChanged();
      });
    };

    const handlePartnerRequestReceived = () => {
      notifyPartnerRequestsChanged();
    };

    socket.on('partner_linked', handlePartnerLinked);
    socket.on('partner_unlinked', handlePartnerUnlinked);
    socket.on('partner_request_received', handlePartnerRequestReceived);
    socket.on('partner_request_cancelled', handlePartnerRequestReceived);
    socket.on('partner_request_declined', handlePartnerRequestReceived);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      socket.off('partner_linked', handlePartnerLinked);
      socket.off('partner_unlinked', handlePartnerUnlinked);
      socket.off('partner_request_received', handlePartnerRequestReceived);
      socket.off('partner_request_cancelled', handlePartnerRequestReceived);
      socket.off('partner_request_declined', handlePartnerRequestReceived);
    };
  }, [user?._id, token, handleBlockedResponse]);

  // Функция для входа
  const login = async (email: string, password: string): Promise<AxiosResponse<any, any> | undefined> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', newToken);
      
      // Настраиваем axios с новым токеном
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      const preferredLocale = await applyPreferredLocale(userData?.locale, {
        userId: userData?._id,
        token: newToken,
      });
      setUser({ ...userData, locale: preferredLocale });
      setIsAuthenticated(true);
      return response;
    } catch (error: any) {
      console.error('Ошибка входа:', error);
      const blockedPayload = getAccountBlockedPayload(error);
      if (blockedPayload) {
        setBlockReasons(blockedPayload.blockedReasons ?? null);
        setBlockReasonFallback(blockedPayload.blockReason ?? null);
        setError(
          resolveBlockReasonForLocale(
            blockedPayload.blockedReasons,
            resolveAppLocale(i18next.language),
            blockedPayload.blockReason
          ) || blockedPayload.blockReason || null
        );
      } else {
        setError(error.response?.data?.error || i18next.t('auth.errors.loginFailed'));
      }
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для регистрации
  const register = async (email: string, username: string, password: string): Promise<AxiosResponse<any, any> | undefined> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        username,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', newToken);
      
      // Настраиваем axios с новым токеном
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      return response;
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      setError(error.response?.data?.error || i18next.t('auth.errors.registerFailed'));
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для выхода
  const logout = () => {
    performLogout();
  };

  // Функция для очистки ошибок
  const clearError = () => {
    setError(null);
  };

  // Функция для обновления данных пользователя
  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        updateUser,
        blockReasons,
        blockReasonFallback,
        clearBlockNotice
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
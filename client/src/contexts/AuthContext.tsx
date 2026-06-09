import React, { createContext, useState, useEffect, useContext } from 'react';
import axios, { AxiosResponse } from 'axios';
import { API_URL } from '../config';
import {
  hasAnyPushSettingEnabled,
  isPushSupported,
  registerServiceWorker,
  subscribeToPush
} from '../services/pushNotifications';
import i18next from '../localization';
import { setAppLocale } from '../localization';
import socketService from '../services/socketService';
import { notifyPartnerChanged } from '../hooks/useRelationship';

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
  updateUser: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Проверяем токен при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Настраиваем axios с токеном
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Получаем данные пользователя
          const response = await axios.get(`${API_URL}/api/auth/me`);
          setUser(response.data);
          setIsAuthenticated(true);
          if (response.data?.locale) {
            setAppLocale(response.data.locale);
          }

          if (
            isPushSupported() &&
            Notification.permission === 'granted' &&
            hasAnyPushSettingEnabled(response.data.notificationSettings)
          ) {
            void registerServiceWorker().then(() => subscribeToPush(token));
          }
        } catch (error) {
          console.error('Ошибка аутентификации:', error);
          // Если токен недействителен, удаляем его
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  useEffect(() => {
    if (!user?._id || !token) {
      return;
    }

    const refreshUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/me`);
        setUser(response.data);
        if (response.data?.locale) {
          setAppLocale(response.data.locale);
        }
      } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
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
      });
    };

    socket.on('partner_linked', handlePartnerLinked);
    socket.on('partner_unlinked', handlePartnerUnlinked);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      socket.off('partner_linked', handlePartnerLinked);
      socket.off('partner_unlinked', handlePartnerUnlinked);
    };
  }, [user?._id, token]);

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
      setUser(userData);
      setIsAuthenticated(true);
      if (userData?.locale) {
        setAppLocale(userData.locale);
      }
      return response;
    } catch (error: any) {
      console.error('Ошибка входа:', error);
      setError(error.response?.data?.error || i18next.t('auth.errors.loginFailed'));
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
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    
    // Удаляем токен из заголовков axios
    delete axios.defaults.headers.common['Authorization'];
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
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
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 
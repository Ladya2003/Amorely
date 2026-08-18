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
import { migrateLocalUiPreferencesToAccount } from '../utils/migrateUiPreferences';
import { clearPendingEmailVerification } from '../utils/pendingEmailVerification';
import { getAuthApiErrorMessage } from '../localization/authHelpers';

export const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED';
export const USE_PASSWORD_LOGIN_CODE = 'USE_PASSWORD_LOGIN';

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
  showDisplayBadge?: boolean;
  showAdminIcon?: boolean;
  role?: 'user' | 'admin';
  locale?: string;
  hasCryptoBackup?: boolean;
  localeBannerDismissedAt?: string | null;
  installBannerDismissed?: boolean;
  emailVerified?: boolean;
  authProvider?: 'local' | 'google';
  chatRulesConsent?: {
    version: number;
    acceptedAt: string;
  } | null;
}

export type GoogleAuthResult =
  | { kind: 'authenticated'; response: AxiosResponse }
  | { kind: 'needs_username'; pendingToken: string; email: string; suggestedUsername: string }
  | { kind: 'use_password'; message: string }
  | { kind: 'error' };

export type ResendVerificationResult =
  | { ok: true; resendAvailableInSeconds: number }
  | { ok: false; resendAvailableInSeconds?: number; cooldown?: boolean };

export type ForgotPasswordResult =
  | { ok: true; resendAvailableInSeconds: number }
  | { ok: false; resendAvailableInSeconds?: number; cooldown?: boolean; message?: string };

export type ResetPasswordResult =
  | { ok: true; authenticated: true }
  | { ok: true; authenticated: false; needsEmailVerification: true; email: string }
  | { ok: false };

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AxiosResponse<any, any> | undefined>;
  register: (email: string, username: string, password: string) => Promise<AxiosResponse<any, any> | undefined>;
  loginWithGoogle: (idToken: string) => Promise<GoogleAuthResult>;
  completeGoogleSignup: (pendingToken: string, username: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<ResendVerificationResult>;
  requestPasswordReset: (email: string) => Promise<ForgotPasswordResult>;
  resetPassword: (token: string, password: string) => Promise<ResetPasswordResult>;
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
  loginWithGoogle: async () => ({ kind: 'error' }),
  completeGoogleSignup: async () => false,
  verifyEmail: async () => false,
  resendVerification: async () => ({ ok: false }),
  requestPasswordReset: async () => ({ ok: false }),
  resetPassword: async () => ({ ok: false }),
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

  const applyAuthSession = useCallback(async (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    const preferredLocale = await applyPreferredLocale(userData?.locale, {
      userId: userData?._id,
      token: newToken,
    });
    const migrated = await migrateLocalUiPreferencesToAccount(userData);
    setUser({ ...userData, locale: preferredLocale, ...migrated });
    setIsAuthenticated(true);
    clearPendingEmailVerification();
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
          const migrated = await migrateLocalUiPreferencesToAccount(response.data);
          setUser({ ...response.data, locale: preferredLocale, ...migrated });
          setIsAuthenticated(true);

          if (
            isPushSupported() &&
            Notification.permission === 'granted' &&
            hasAnyPushSettingEnabled(response.data.notificationSettings)
          ) {
            void registerServiceWorker().then(() => subscribeToPush(token));
          }
        } catch (authError: any) {
          console.error('Ошибка аутентификации:', authError);
          const blockedPayload = getAccountBlockedPayload(authError);
          if (blockedPayload) {
            handleBlockedResponse(blockedPayload);
          } else if (authError?.response?.data?.code === EMAIL_NOT_VERIFIED_CODE) {
            performLogout();
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
    const handleMemoryRestoreChanged = () => {
      window.dispatchEvent(new CustomEvent('amorely:memory-restore-changed'));
      notifyCalendarEventsChanged();
    };

    socket.on('partner_linked', handlePartnerLinked);
    socket.on('partner_unlinked', handlePartnerUnlinked);
    socket.on('partner_request_received', handlePartnerRequestReceived);
    socket.on('partner_request_cancelled', handlePartnerRequestReceived);
    socket.on('partner_request_declined', handlePartnerRequestReceived);
    socket.on('memory_restore_request_received', handleMemoryRestoreChanged);
    socket.on('memory_restore_request_updated', handleMemoryRestoreChanged);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      socket.off('partner_linked', handlePartnerLinked);
      socket.off('partner_unlinked', handlePartnerUnlinked);
      socket.off('partner_request_received', handlePartnerRequestReceived);
      socket.off('partner_request_cancelled', handlePartnerRequestReceived);
      socket.off('partner_request_declined', handlePartnerRequestReceived);
      socket.off('memory_restore_request_received', handleMemoryRestoreChanged);
      socket.off('memory_restore_request_updated', handleMemoryRestoreChanged);
    };
  }, [user?._id, token, handleBlockedResponse]);

  const login = async (email: string, password: string): Promise<AxiosResponse<any, any> | undefined> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      await applyAuthSession(newToken, userData);
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
      } else if (error.response?.data?.code === EMAIL_NOT_VERIFIED_CODE) {
        setError(EMAIL_NOT_VERIFIED_CODE);
      } else {
        setError(error.response?.data?.error || i18next.t('auth.errors.loginFailed'));
      }
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string): Promise<AxiosResponse<any, any> | undefined> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        username,
        password
      });

      if (response.data?.needsEmailVerification) {
        return response;
      }

      const { token: newToken, user: userData } = response.data;
      if (newToken && userData) {
        await applyAuthSession(newToken, userData);
      }
      return response;
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      setError(error.response?.data?.error || i18next.t('auth.errors.registerFailed'));
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (idToken: string): Promise<GoogleAuthResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/api/auth/google`, { idToken });

      if (response.data?.needsUsername && response.data?.pendingToken) {
        return {
          kind: 'needs_username',
          pendingToken: response.data.pendingToken,
          email: response.data.email || '',
          suggestedUsername: response.data.suggestedUsername || '',
        };
      }

      const { token: newToken, user: userData } = response.data;
      await applyAuthSession(newToken, userData);
      return { kind: 'authenticated', response };
    } catch (error: any) {
      console.error('Ошибка Google Sign-In:', error);
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
        return { kind: 'error' };
      }
      if (error.response?.data?.code === USE_PASSWORD_LOGIN_CODE) {
        const message =
          error.response?.data?.message || i18next.t('auth.errors.usePasswordLogin');
        setError(USE_PASSWORD_LOGIN_CODE);
        return { kind: 'use_password', message };
      }
      setError(error.response?.data?.error || i18next.t('auth.errors.googleFailed'));
      return { kind: 'error' };
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleSignup = async (pendingToken: string, username: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/api/auth/google/complete`, {
        pendingToken,
        username,
      });
      const { token: newToken, user: userData } = response.data;
      await applyAuthSession(newToken, userData);
      return true;
    } catch (error: any) {
      console.error('Ошибка завершения Google Sign-In:', error);
      if (error.response?.data?.code === USE_PASSWORD_LOGIN_CODE) {
        setError(USE_PASSWORD_LOGIN_CODE);
      } else {
        setError(error.response?.data?.error || i18next.t('auth.errors.googleFailed'));
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = useCallback(async (rawToken: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/api/auth/verify-email`, { token: rawToken });
      const { token: newToken, user: userData } = response.data;
      await applyAuthSession(newToken, userData);
      return true;
    } catch (error: any) {
      console.error('Ошибка подтверждения email:', error);
      setError(error.response?.data?.error || i18next.t('auth.verify.failed'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthSession]);

  const resendVerification = async (email: string): Promise<ResendVerificationResult> => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/resend-verification`, { email });
      return {
        ok: true,
        resendAvailableInSeconds: Number(response.data?.resendAvailableInSeconds) || 60,
      };
    } catch (error: any) {
      console.error('Ошибка повторной отправки подтверждения:', error);
      const retryAfter = Number(error.response?.data?.resendAvailableInSeconds);
      if (error.response?.status === 429 || error.response?.data?.code === 'RESEND_COOLDOWN') {
        return {
          ok: false,
          cooldown: true,
          resendAvailableInSeconds: Number.isFinite(retryAfter) ? retryAfter : 60,
        };
      }
      setError(error.response?.data?.error || i18next.t('auth.verify.resendFailed'));
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string): Promise<ForgotPasswordResult> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      return {
        ok: true,
        resendAvailableInSeconds: Number(response.data?.resendAvailableInSeconds) || 60,
      };
    } catch (error: any) {
      console.error('Ошибка запроса сброса пароля:', error);
      const retryAfter = Number(error.response?.data?.resendAvailableInSeconds);
      if (error.response?.status === 429 || error.response?.data?.code === 'RESEND_COOLDOWN') {
        return {
          ok: false,
          cooldown: true,
          resendAvailableInSeconds: Number.isFinite(retryAfter) ? retryAfter : 60,
        };
      }
      const message = getAuthApiErrorMessage(
        error.response?.data,
        i18next.t('auth.forgotPassword.requestFailed')
      );
      setError(message);
      return { ok: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = useCallback(async (rawToken: string, password: string): Promise<ResetPasswordResult> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token: rawToken,
        password,
      });

      if (response.data?.needsEmailVerification) {
        return {
          ok: true,
          authenticated: false,
          needsEmailVerification: true,
          email: String(response.data.email || ''),
        };
      }

      const { token: newToken, user: userData } = response.data;
      if (!newToken || !userData) {
        setError(i18next.t('auth.forgotPassword.resetFailed'));
        return { ok: false };
      }

      await applyAuthSession(newToken, userData);
      return { ok: true, authenticated: true };
    } catch (error: any) {
      console.error('Ошибка сброса пароля:', error);
      const blockedPayload = getAccountBlockedPayload(error);
      if (blockedPayload) {
        handleBlockedResponse(blockedPayload);
        return { ok: false };
      }
      setError(
        getAuthApiErrorMessage(
          error.response?.data,
          i18next.t('auth.forgotPassword.resetFailed')
        )
      );
      return { ok: false };
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthSession, handleBlockedResponse]);

  const logout = () => {
    performLogout();
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
        loginWithGoogle,
        completeGoogleSignup,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        resetPassword,
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

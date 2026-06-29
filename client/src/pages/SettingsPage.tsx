import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import { API_URL } from '../config';
import ProfileForm, { UserProfile } from '../components/Settings/ProfileForm';
import PartnerSettingsTab from '../components/Settings/PartnerSettingsTab';
import { notifyBreakupInitiated, notifyPartnerChanged } from '../hooks/useRelationship';
import { notifyPartnerRequestsChanged } from '../hooks/usePartnerRequests';
import { notifyCalendarEventsChanged } from '../hooks/useCalendarEvents';
import ThemeSettings from '../components/Settings/ThemeSettings';
import { PrimaryColorPreference } from '../theme/appTheme';
import { AppLocale, resolveAppLocale } from '../localization/locale';
import { setAppLocale } from '../localization';
import SecuritySettings from '../components/Settings/SecuritySettings';
import NotificationSettings from '../components/Settings/NotificationSettings';
import LogoutButton from '../components/Settings/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import { useTabSlideDirection } from '../hooks/useTabSlideDirection';
import {
  checkPushSubscriptionStatus,
  ensurePushSubscription,
  getNotificationPermission,
  hasAnyPushSettingEnabled,
  isPushSupported,
  registerServiceWorker,
  unsubscribeFromPush
} from '../services/pushNotifications';
import {
  getSettingsBodySx,
  getSettingsContentPanelSx,
  getSettingsContentScrollSx,
  getSettingsLoadingWrapSx,
  getSettingsNavPanelSx,
  getSettingsNavTabSx,
  getSettingsNavWrapSx,
  getSettingsPageHeaderGlowWrapSx,
  getSettingsPageHeaderRowSx,
  getSettingsPageRootSx,
  getSettingsPageTitleSx,
  getSettingsTabPanelEnterSx,
  settingsPageEnterSx,
} from '../components/Settings/settingsPageStyles';

const SETTINGS_TAB_KEYS = ['profile', 'partner', 'theme', 'notifications', 'security'] as const;

const getSettingsTabIndex = (tab?: string | null) => {
  if (!tab) {
    return 0;
  }
  const index = SETTINGS_TAB_KEYS.indexOf(tab as typeof SETTINGS_TAB_KEYS[number]);
  return index >= 0 ? index : 0;
};

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: authUser, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(() => getSettingsTabIndex(searchParams.get('tab')));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [primaryColor, setPrimaryColor] = useState<PrimaryColorPreference>('pink');
  const [locale, setLocale] = useState<AppLocale>('ru');
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const tabSlideDirection = useTabSlideDirection(tabValue);

  const settingsTabs = useMemo(
    () => [
      { icon: PersonIcon, label: t('settings.tabs.profile') },
      { icon: PeopleIcon, label: t('settings.tabs.partner') },
      { icon: PaletteIcon, label: t('settings.tabs.theme') },
      { icon: NotificationsIcon, label: t('settings.tabs.notifications') },
      { icon: SecurityIcon, label: t('settings.tabs.security') },
    ],
    [t]
  );

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    setTabValue(getSettingsTabIndex(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    setPushPermission(getNotificationPermission());
    if (isPushSupported()) {
      void registerServiceWorker();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('settings.errors.notAuthorized'));
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const loadedUser = response.data;

      setUser(loadedUser);
      setTheme(loadedUser.theme || 'system');
      setPrimaryColor(loadedUser.primaryColor || 'pink');
      setLocale(resolveAppLocale(loadedUser.locale));
      const loadedNotificationSettings = {
        email: {
          newContent: true,
          messages: true,
          events: true,
          news: false,
          ...(loadedUser.notificationSettings?.email ?? {}),
        },
        push: {
          newContent: true,
          messages: true,
          events: false,
          news: false,
          reports: loadedUser.role === 'admin',
          ...(loadedUser.notificationSettings?.push ?? {}),
        },
      };
      setNotificationSettings(loadedNotificationSettings);
      setPushPermission(getNotificationPermission());
      if (isPushSupported()) {
        const pushStatus = await checkPushSubscriptionStatus();
        setPushSubscribed(pushStatus.subscribed);
        setPushPermission(pushStatus.permission);
      }

      setIsLoading(false);
    } catch (fetchError) {
      console.error('Ошибка при загрузке данных пользователя:', fetchError);
      setError(t('settings.errors.loadFailed'));
      setIsLoading(false);
    }
  };

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async (formData: FormData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error(t('settings.errors.notAuthorizedShort'));
    }

    const response = await axios.put(`${API_URL}/api/settings/user/${user?._id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      },
    });

    setUser(response.data.user);
    updateUser(response.data.user);
  };

  const handleBadgePreferenceSaved = (displayBadgeGameId: string | null) => {
    setUser((prev) => (prev ? { ...prev, displayBadgeGameId } : prev));
    if (authUser) {
      updateUser({ ...authUser, displayBadgeGameId });
    }
  };

  const handleAddPartner = async (partnerEmail: string, startDate: Date) => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('settings.errors.notAuthorizedShort'));
      }

      const response = await axios.post(`${API_URL}/api/relationships`, {
        partnerEmail,
        relationshipStartDate: startDate.toISOString()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      notifyPartnerRequestsChanged();

      setIsLoading(false);
    } catch (addError: any) {
      console.error('Ошибка при добавлении партнера:', addError);
      setIsLoading(false);
      throw addError;
    }
  };

  const handleRemovePartner = async (options: { keepEvents: boolean; keepPlans: boolean }) => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('settings.errors.notAuthorizedShort'));
      }

      await axios.delete(`${API_URL}/api/relationships`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          keepEvents: options.keepEvents,
          keepPlans: options.keepPlans
        }
      });

      if (authUser) {
        updateUser({ ...authUser, partnerId: undefined, relationshipStartDate: undefined });
      }

      notifyBreakupInitiated();
      notifyPartnerChanged();
      notifyPartnerRequestsChanged();
      notifyCalendarEventsChanged();

      setIsLoading(false);
    } catch (removeError: any) {
      console.error('Ошибка при удалении партнера:', removeError);
      setIsLoading(false);
      if (removeError.response && removeError.response.data) {
        throw removeError.response.data;
      }
      throw { error: t('settings.errors.removePartnerFailed') };
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    const previousTheme = theme;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('settings.errors.notAuthorizedShort'));
      }

      setTheme(newTheme);
      if (authUser) {
        updateUser({ ...authUser, theme: newTheme });
      }

      await axios.put(`${API_URL}/api/settings/theme`, {
        userId: user?._id,
        theme: newTheme
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (themeError) {
      console.error('Ошибка при изменении темы:', themeError);
      setTheme(previousTheme);
      if (authUser) {
        updateUser({ ...authUser, theme: previousTheme });
      }
    }
  };

  const handleLocaleChange = async (newLocale: AppLocale) => {
    const previousLocale = locale;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('settings.errors.notAuthorizedShort'));
      }

      setLocale(newLocale);
      setAppLocale(newLocale);
      if (authUser) {
        updateUser({ ...authUser, locale: newLocale });
      }

      await axios.put(
        `${API_URL}/api/settings/theme`,
        {
          userId: user?._id,
          locale: newLocale,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (localeError) {
      console.error('Ошибка при изменении языка:', localeError);
      setLocale(previousLocale);
      setAppLocale(previousLocale);
      if (authUser) {
        updateUser({ ...authUser, locale: previousLocale });
      }
    }
  };

  const handlePrimaryColorChange = async (newPrimaryColor: PrimaryColorPreference) => {
    const previousPrimaryColor = primaryColor;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('settings.errors.notAuthorizedShort'));
      }

      setPrimaryColor(newPrimaryColor);
      if (authUser) {
        updateUser({ ...authUser, primaryColor: newPrimaryColor });
      }

      await axios.put(`${API_URL}/api/settings/theme`, {
        userId: user?._id,
        primaryColor: newPrimaryColor
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (colorError) {
      console.error('Ошибка при изменении основного цвета:', colorError);
      setPrimaryColor(previousPrimaryColor);
      if (authUser) {
        updateUser({ ...authUser, primaryColor: previousPrimaryColor });
      }
    }
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('settings.errors.notAuthorizedShort'));
      }

      await axios.post(`${API_URL}/api/auth/change-password`, {
        userId: user?._id,
        oldPassword,
        newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setIsLoading(false);
    } catch (passwordError) {
      console.error('Ошибка при изменении пароля:', passwordError);
      setIsLoading(false);
      throw passwordError;
    }
  };

  const syncPushSubscription = async (settings: any) => {
    const token = localStorage.getItem('token');
    if (!token || !isPushSupported()) {
      return;
    }

    if (!hasAnyPushSettingEnabled(settings)) {
      setPushSubscribed(false);
      return;
    }

    const result = await ensurePushSubscription(token, true);
    setPushSubscribed(result.subscribed);
    setPushPermission(result.permission);
  };

  const handlePushMasterToggle = async (enabled: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      setIsEnablingPush(true);

      if (enabled) {
        const result = await ensurePushSubscription(token, true);
        setPushSubscribed(result.subscribed);
        setPushPermission(result.permission);
        return;
      }

      await unsubscribeFromPush(token);
      setPushSubscribed(false);

      const nextSettings = {
        ...notificationSettings,
        push: {
          newContent: false,
          messages: false,
          events: false,
          news: false,
          reports: false,
        }
      };

      setNotificationSettings(nextSettings);

      await axios.put(`${API_URL}/api/settings/notifications`, {
        settings: nextSettings
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (toggleError) {
      console.error('Ошибка переключения push-уведомлений:', toggleError);
      fetchUserData();
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleNotificationSettingChange = async (type: 'email' | 'push', setting: string, value: boolean) => {
    try {
      const nextSettings = {
        ...notificationSettings,
        [type]: {
          ...notificationSettings[type],
          [setting]: value
        }
      };

      setNotificationSettings(nextSettings);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('settings.errors.notAuthorizedShort'));
      }

      await axios.put(`${API_URL}/api/settings/notifications`, {
        settings: nextSettings
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (type === 'push' && value) {
        await syncPushSubscription(nextSettings);
      }
    } catch (changeError) {
      console.error('Ошибка при обновлении настроек уведомлений:', changeError);
      fetchUserData();
    }
  };

  if (isLoading && !user) {
    return (
      <Box sx={getSettingsPageRootSx(muiTheme)}>
        <Box sx={getSettingsLoadingWrapSx()}>
          <CircularProgress size={32} />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={getSettingsPageRootSx(muiTheme)}>
        <Box sx={{ px: 2, py: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={getSettingsPageRootSx(muiTheme)}>
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          ...settingsPageEnterSx,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
        }}
      >
        <Box sx={getSettingsPageHeaderGlowWrapSx(muiTheme)}>
          <Box sx={getSettingsPageHeaderRowSx()}>
            <Typography component="h1" sx={getSettingsPageTitleSx()}>
              {t('settings.title')}
            </Typography>
            <LogoutButton size="small" />
          </Box>
        </Box>

        <Box sx={getSettingsBodySx(isMobile)}>
          <Box sx={getSettingsNavWrapSx(isMobile)}>
            <Box sx={getSettingsNavPanelSx(muiTheme, isMobile)} role="tablist" aria-label={t('settings.title')}>
              {settingsTabs.map((tab, index) => {
                const Icon = tab.icon;
                const selected = tabValue === index;
                return (
                  <Box
                    key={SETTINGS_TAB_KEYS[index]}
                    component="button"
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => handleTabChange(index)}
                    sx={getSettingsNavTabSx(muiTheme, { selected, isMobile })}
                  >
                    <Icon />
                    {tab.label}
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box sx={getSettingsContentPanelSx(muiTheme)}>
            <Box key={tabValue} sx={{ ...getSettingsContentScrollSx(), ...getSettingsTabPanelEnterSx(tabSlideDirection) }}>
              {tabValue === 0 && user && (
                <ProfileForm
                  user={user}
                  onSave={handleSaveProfile}
                  onBadgePreferenceSaved={handleBadgePreferenceSaved}
                />
              )}

              {tabValue === 1 && user && (
                <PartnerSettingsTab
                  userId={user._id}
                  onAddPartner={handleAddPartner}
                  onRemovePartner={handleRemovePartner}
                  isActionLoading={isLoading}
                />
              )}

              {tabValue === 2 && (
                <ThemeSettings
                  currentTheme={theme}
                  onThemeChange={handleThemeChange}
                  currentPrimaryColor={primaryColor}
                  onPrimaryColorChange={handlePrimaryColorChange}
                  currentLocale={locale}
                  onLocaleChange={handleLocaleChange}
                />
              )}

              {tabValue === 3 && notificationSettings && (
                <NotificationSettings
                  settings={notificationSettings}
                  isAdmin={user?.role === 'admin'}
                  onSettingChange={handleNotificationSettingChange}
                  pushSupported={isPushSupported()}
                  pushPermission={pushPermission}
                  pushSubscribed={pushSubscribed}
                  onPushMasterToggle={handlePushMasterToggle}
                  isEnablingPush={isEnablingPush}
                />
              )}

              {tabValue === 4 && (
                <SecuritySettings
                  onChangePassword={handleChangePassword}
                  isLoading={isLoading}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert,
  useMediaQuery,
  useTheme,
  Paper,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import { API_URL } from '../config';
import ProfileForm, { UserProfile } from '../components/Settings/ProfileForm';
import PartnerForm, { Partner } from '../components/Settings/PartnerForm';
import ThemeSettings from '../components/Settings/ThemeSettings';
import { PrimaryColorPreference } from '../theme/appTheme';
import SecuritySettings from '../components/Settings/SecuritySettings';
import NotificationSettings from '../components/Settings/NotificationSettings';
import LogoutButton from '../components/Settings/LogoutButton';
import { useAuth } from '../contexts/AuthContext';
import {
  checkPushSubscriptionStatus,
  ensurePushSubscription,
  getNotificationPermission,
  hasAnyPushSettingEnabled,
  isPushSupported,
  registerServiceWorker,
  unsubscribeFromPush
} from '../services/pushNotifications';

const SETTINGS_TAB_KEYS = ['profile', 'partner', 'theme', 'notifications', 'security'] as const;

const getSettingsTabIndex = (tab?: string | null) => {
  if (!tab) {
    return 0;
  }
  const index = SETTINGS_TAB_KEYS.indexOf(tab as typeof SETTINGS_TAB_KEYS[number]);
  return index >= 0 ? index : 0;
};

const SettingsPage: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(() => getSettingsTabIndex(searchParams.get('tab')));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [primaryColor, setPrimaryColor] = useState<PrimaryColorPreference>('pink');
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
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
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Не авторизован. Пожалуйста, войдите в систему.');
        setIsLoading(false);
        return;
      }
      
      // Получаем данные пользователя
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const user = response.data;
      
      setUser(user);
      setTheme(user.theme || 'system');
      setPrimaryColor(user.primaryColor || 'pink');
      const loadedNotificationSettings = user.notificationSettings || {
        email: {
          newContent: true,
          messages: true,
          events: true,
          news: false
        },
        push: {
          newContent: true,
          messages: true,
          events: false,
          news: false
        }
      };
      setNotificationSettings(loadedNotificationSettings);
      setPushPermission(getNotificationPermission());
      if (isPushSupported()) {
        const pushStatus = await checkPushSubscriptionStatus();
        setPushSubscribed(pushStatus.subscribed);
        setPushPermission(pushStatus.permission);
      }
      
      // Если у пользователя есть партнер, пробуем получить активные отношения.
      // 404 означает, что активных отношений нет (например, запись удалена вручную).
      if (user.partnerId) {
        try {
          const relationshipResponse = await axios.get(`${API_URL}/api/relationships`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setPartner(relationshipResponse.data.partner);
          setRelationshipStartDate(relationshipResponse.data.relationship.startDate);
        } catch (relationshipError: any) {
          if (relationshipError?.response?.status === 404) {
            setPartner(null);
            setRelationshipStartDate(null);
            setUser({ ...user, partnerId: undefined });
          } else {
            throw relationshipError;
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
      setError('Не удалось загрузить данные пользователя. Пожалуйста, попробуйте позже.');
      setIsLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSaveProfile = async (formData: FormData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Не авторизован');
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
  
  const handleAddPartner = async (partnerEmail: string, startDate: Date) => {
    try {
      setIsLoading(true);
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      // Отправляем запрос на добавление партнера
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
      
      // Обновляем данные о партнере и отношениях
      setRelationshipStartDate(response.data.relationship.startDate);
      setPartner(response.data.partner);
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Ошибка при добавлении партнера:', error);
      setIsLoading(false);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { error: 'Не удалось добавить партнера' };
    }
  };

  const handleRemovePartner = async () => {
    try {
      setIsLoading(true);
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      // Отправляем запрос на удаление партнера
      await axios.delete(`${API_URL}/api/relationships`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Обновляем локальное состояние
      setPartner(null);
      setRelationshipStartDate(null);
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Ошибка при удалении партнера:', error);
      setIsLoading(false);
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw { error: 'Не удалось удалить партнера' };
    }
  };
  
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    const previousTheme = theme;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
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
    } catch (error) {
      console.error('Ошибка при изменении темы:', error);
      setTheme(previousTheme);
      if (authUser) {
        updateUser({ ...authUser, theme: previousTheme });
      }
    }
  };

  const handlePrimaryColorChange = async (newPrimaryColor: PrimaryColorPreference) => {
    const previousPrimaryColor = primaryColor;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
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
    } catch (error) {
      console.error('Ошибка при изменении основного цвета:', error);
      setPrimaryColor(previousPrimaryColor);
      if (authUser) {
        updateUser({ ...authUser, primaryColor: previousPrimaryColor });
      }
    }
  };
  
  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      // Отправляем запрос на изменение пароля
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
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      setIsLoading(false);
      throw error;
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
          news: false
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
        throw new Error('Не авторизован');
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxWidth: 'lg',
        width: '100%',
        mx: 'auto',
        px: isMobile ? 2 : 3,
        py: isMobile ? 2 : 4,
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexShrink: 0,
          mb: 1,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontSize: '1.7rem' }}>
          Настройки
        </Typography>
        <LogoutButton size="small" />
      </Box>
      
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: isMobile ? 'column' : 'row',
          mt: isMobile ? 2 : 3,
          minHeight: 0,
          gap: isMobile ? 2 : 0,
        }}
      >
        {/* Вкладки */}
        <Box sx={{ 
          width: isMobile ? '100%' : 240, 
          flexShrink: 0,
          mr: isMobile ? 0 : 3
        }}>
          <Paper elevation={1} sx={{ borderRadius: 2 }}>
            <Tabs
              orientation={isMobile ? 'horizontal' : 'vertical'}
              variant={isMobile ? 'scrollable' : 'standard'}
              value={tabValue}
              onChange={handleTabChange}
              aria-label="settings tabs"
              sx={{ 
                borderRight: isMobile ? 0 : 1, 
                borderColor: 'divider',
                minHeight: isMobile ? 'auto' : 300,
                '.MuiTab-root': {
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  py: 1,
                  px: 1.5,
                  minHeight: 40,
                }
              }}
            >
              <Tab 
                icon={<PersonIcon />} 
                label="Профиль" 
                iconPosition="start"
              />
              <Tab 
                icon={<PeopleIcon />} 
                label="Партнер" 
                iconPosition="start"
              />
              <Tab 
                icon={<PaletteIcon />} 
                label="Тема" 
                iconPosition="start"
              />
              <Tab 
                icon={<NotificationsIcon />} 
                label="Уведомления" 
                iconPosition="start"
              />
              <Tab 
                icon={<SecurityIcon />} 
                label="Безопасность" 
                iconPosition="start"
              />
            </Tabs>
          </Paper>
        </Box>
        
        {/* Содержимое вкладок */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              borderRadius: 2,
            }}
          >
          {tabValue === 0 && user && (
            <ProfileForm 
              user={user} 
              onSave={handleSaveProfile} 
            />
          )}
          
          {tabValue === 1 && user && (
            <PartnerForm 
              userId={user._id}
              partner={partner}
              relationshipStartDate={relationshipStartDate}
              onAddPartner={handleAddPartner}
              onRemovePartner={handleRemovePartner}
              isLoading={isLoading}
            />
          )}
          
          {tabValue === 2 && (
            <ThemeSettings 
              currentTheme={theme} 
              onThemeChange={handleThemeChange}
              currentPrimaryColor={primaryColor}
              onPrimaryColorChange={handlePrimaryColorChange}
            />
          )}
          
          {tabValue === 3 && notificationSettings && (
            <NotificationSettings 
              settings={notificationSettings}
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
  );
};

export default SettingsPage; 
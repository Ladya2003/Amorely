import React, { useState, useEffect } from 'react';
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
  Paper
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
import SecuritySettings from '../components/Settings/SecuritySettings';
import NotificationSettings from '../components/Settings/NotificationSettings';
import LogoutButton from '../components/Settings/LogoutButton';

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notificationSettings, setNotificationSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  useEffect(() => {
    fetchUserData();
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
      
      setUser(response.data);
      setTheme(response.data.theme || 'system');
      setNotificationSettings(response.data.notificationSettings || {
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
      });
      
      // Если у пользователя есть партнер, получаем его данные
      if (response.data.partnerId) {
        const partnerResponse = await axios.get(`${API_URL}/api/settings/user/${response.data.partnerId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setPartner(partnerResponse.data.user);
        setRelationshipStartDate(partnerResponse.data.partnership.startDate);
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
    try {
      setIsLoading(true);
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      // Отправляем запрос на обновление профиля
      const response = await axios.put(`${API_URL}/api/settings/user/${user?._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });
      
      setUser(response.data.user);
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      setIsLoading(false);
      throw error;
    }
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
      const response = await axios.post(`${API_URL}/api/settings/partner`, {
        userId: user?._id,
        partnerEmail,
        relationshipStartDate: startDate.toISOString()
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Обновляем данные о партнере и отношениях
      setRelationshipStartDate(startDate.toISOString());
      setPartner(response.data.partner);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при добавлении партнера:', error);
      setIsLoading(false);
      throw error;
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
      await axios.delete(`${API_URL}/api/settings/partner/${user?._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Обновляем локальное состояние
      setPartner(null);
      setRelationshipStartDate(null);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при удалении партнера:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      // Обновляем тему в локальном состоянии
      setTheme(newTheme);
      
      // Отправляем запрос на обновление темы
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
      // Возвращаем предыдущую тему в случае ошибки
      setTheme(theme);
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
  
  const handleNotificationSettingChange = async (type: 'email' | 'push', setting: string, value: boolean) => {
    try {
      // Обновляем локальное состояние
      setNotificationSettings((prev: any) => ({
        ...prev,
        [type]: {
          ...prev[type],
          [setting]: value
        }
      }));
      
      // Получаем токен из localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      // Отправляем запрос на обновление настроек уведомлений
      await axios.put(`${API_URL}/api/settings/notifications`, {
        userId: user?._id,
        settings: {
          ...notificationSettings,
          [type]: {
            ...notificationSettings[type],
            [setting]: value
          }
        }
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Ошибка при обновлении настроек уведомлений:', error);
      // Возвращаем предыдущие настройки в случае ошибки
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Настройки
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', mt: 3 }}>
        {/* Вкладки */}
        <Box sx={{ 
          width: isMobile ? '100%' : 240, 
          mb: isMobile ? 2 : 0,
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
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  py: 2
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
                icon={<SecurityIcon />} 
                label="Безопасность" 
                iconPosition="start"
              />
              <Tab 
                icon={<NotificationsIcon />} 
                label="Уведомления" 
                iconPosition="start"
              />
            </Tabs>
          </Paper>
        </Box>
        
        {/* Содержимое вкладок */}
        <Box sx={{ flexGrow: 1 }}>
          {tabValue === 0 && user && (
            <ProfileForm 
              user={user} 
              onSave={handleSaveProfile} 
              isLoading={isLoading} 
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
            />
          )}
          
          {tabValue === 3 && (
            <SecuritySettings 
              onChangePassword={handleChangePassword}
              isLoading={isLoading}
            />
          )}
          
          {tabValue === 4 && notificationSettings && (
            <NotificationSettings 
              settings={notificationSettings}
              onSettingChange={handleNotificationSettingChange}
            />
          )}
        </Box>
      </Box>
      
      {/* Добавляем кнопку выхода из аккаунта */}
      <LogoutButton />
    </Container>
  );
};

export default SettingsPage; 
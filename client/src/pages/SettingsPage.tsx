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

// Временные данные для демонстрации
const MOCK_USER: UserProfile = {
  _id: 'user123',
  email: 'user@example.com',
  username: 'user123',
  firstName: 'Иван',
  lastName: 'Иванов',
  bio: 'Люблю путешествовать и фотографировать',
  avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
};

const MOCK_PARTNER: Partner | null = {
  _id: 'partner456',
  email: 'partner@example.com',
  username: 'partner456',
  firstName: 'Анна',
  lastName: 'Смирнова',
  avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
};

const MOCK_RELATIONSHIP_START_DATE = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString();

const MOCK_NOTIFICATION_SETTINGS = {
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

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [relationshipStartDate, setRelationshipStartDate] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notificationSettings, setNotificationSettings] = useState(MOCK_NOTIFICATION_SETTINGS);
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
      
      // В реальном приложении здесь будет запрос к API
      // const response = await axios.get(`${API_URL}/api/settings/user/${userId}`);
      // setUser(response.data);
      
      // Используем моковые данные для демонстрации
      setTimeout(() => {
        setUser(MOCK_USER);
        setPartner(MOCK_PARTNER);
        setRelationshipStartDate(MOCK_RELATIONSHIP_START_DATE);
        setIsLoading(false);
      }, 1000);
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
      
      // В реальном приложении здесь будет запрос к API
      // const response = await axios.put(`${API_URL}/api/settings/user/${user?._id}`, formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });
      // setUser(response.data.user);
      
      // Имитация запроса для демонстрации
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Обновляем локальное состояние
      if (user) {
        const updatedUser = { ...user };
        updatedUser.username = formData.get('username') as string;
        updatedUser.firstName = formData.get('firstName') as string;
        updatedUser.lastName = formData.get('lastName') as string;
        updatedUser.bio = formData.get('bio') as string;
        
        // Если был загружен новый аватар, создаем временный URL
        const avatarFile = formData.get('avatar') as File;
        if (avatarFile) {
          const existingAvatarUrl = updatedUser.avatar;
          if (existingAvatarUrl && existingAvatarUrl.startsWith('blob:')) {
            URL.revokeObjectURL(existingAvatarUrl);
          }
          updatedUser.avatar = URL.createObjectURL(avatarFile);
        }
        
        setUser(updatedUser);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  const handleAddPartner = async (partnerId: string, startDate: Date) => {
    try {
      setIsLoading(true);
      
      // В реальном приложении здесь будет запрос к API
      // const response = await axios.post(`${API_URL}/api/settings/partner`, {
      //   userId: user?._id,
      //   partnerId,
      //   relationshipStartDate: startDate.toISOString()
      // });
      
      // Имитация запроса для демонстрации
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Обновляем локальное состояние
      setRelationshipStartDate(startDate.toISOString());
      
      // В реальном приложении здесь будет запрос для получения данных партнера
      // const partnerResponse = await axios.get(`${API_URL}/api/settings/user/${partnerId}`);
      // setPartner(partnerResponse.data);
      
      // Используем моковые данные для демонстрации
      setPartner(MOCK_PARTNER);
      
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
      
      // В реальном приложении здесь будет запрос к API
      // await axios.delete(`${API_URL}/api/settings/partner/${user?._id}`);
      
      // Имитация запроса для демонстрации
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
  
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // В реальном приложении здесь будет логика для сохранения настройки темы
  };
  
  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      
      // В реальном приложении здесь будет запрос к API
      // await axios.post(`${API_URL}/api/settings/change-password`, {
      //   userId: user?._id,
      //   oldPassword,
      //   newPassword
      // });
      
      // Имитация запроса для демонстрации
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      setIsLoading(false);
      throw error;
    }
  };
  
  const handleNotificationSettingChange = (type: 'email' | 'push', setting: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [setting]: value
      }
    }));
    
    // В реальном приложении здесь будет запрос для сохранения настроек уведомлений
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
          
          {tabValue === 4 && (
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
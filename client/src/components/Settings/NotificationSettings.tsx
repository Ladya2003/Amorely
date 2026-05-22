import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  FormGroup, 
  FormControlLabel, 
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Alert,
  Button
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import EventIcon from '@mui/icons-material/Event';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

interface NotificationSettingsProps {
  settings: {
    email: {
      newContent: boolean;
      messages: boolean;
      events: boolean;
      news: boolean;
    };
    push: {
      newContent: boolean;
      messages: boolean;
      events: boolean;
      news: boolean;
    };
  };
  onSettingChange: (type: 'email' | 'push', setting: string, value: boolean) => void;
  pushSupported: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  pushSubscribed: boolean;
  onEnablePush: () => void;
  isEnablingPush: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingChange,
  pushSupported,
  pushPermission,
  pushSubscribed,
  onEnablePush,
  isEnablingPush
}) => {
  const handleEmailChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('email', setting, event.target.checked);
  };
  
  const handlePushChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('push', setting, event.target.checked);
  };

  const renderPushStatus = () => {
    if (!pushSupported) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Push-уведомления недоступны в этом браузере. На iPhone они работают только если сайт
          добавлен на экран «Домой» (iOS 16.4+).
        </Alert>
      );
    }

    if (pushPermission === 'denied') {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Уведомления заблокированы в настройках браузера или телефона. Разрешите их для Amorely
          и вернитесь сюда.
        </Alert>
      );
    }

    if (!pushSubscribed) {
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          Чтобы получать уведомления как в Telegram, включите их на этом устройстве. Откройте
          приложение с ярлыка на рабочем столе и нажмите кнопку ниже.
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<NotificationsActiveIcon />}
              onClick={onEnablePush}
              disabled={isEnablingPush}
            >
              {isEnablingPush ? 'Подключение…' : 'Включить уведомления на устройстве'}
            </Button>
          </Box>
        </Alert>
      );
    }

    return (
      <Alert severity="success" sx={{ mb: 2 }}>
        Push-уведомления включены на этом устройстве.
      </Alert>
    );
  };
  
  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Уведомления
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <List
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'transparent' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Email уведомления</Typography>
            </Box>
          </ListSubheader>
        }
      >
        <ListItem>
          <ListItemIcon>
            <FavoriteIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Новый контент от партнера" 
            secondary="Получать уведомления, когда партнер добавляет новый контент"
          />
          <Switch
            edge="end"
            checked={settings.email.newContent}
            onChange={handleEmailChange('newContent')}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Сообщения" 
            secondary="Получать уведомления о новых сообщениях"
          />
          <Switch
            edge="end"
            checked={settings.email.messages}
            onChange={handleEmailChange('messages')}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText 
            primary="События" 
            secondary="Получать уведомления о важных датах и событиях"
          />
          <Switch
            edge="end"
            checked={settings.email.events}
            onChange={handleEmailChange('events')}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <NewReleasesIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Новости" 
            secondary="Получать уведомления о новостях и обновлениях приложения"
          />
          <Switch
            edge="end"
            checked={settings.email.news}
            onChange={handleEmailChange('news')}
          />
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      {renderPushStatus()}

      <List
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'transparent' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">Push-уведомления</Typography>
            </Box>
          </ListSubheader>
        }
      >
        <ListItem>
          <ListItemIcon>
            <FavoriteIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Новый контент от партнера" 
            secondary="Получать уведомления, когда партнер добавляет новый контент"
          />
          <Switch
            edge="end"
            checked={settings.push.newContent}
            onChange={handlePushChange('newContent')}
            disabled={!pushSupported}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ChatIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Сообщения" 
            secondary="Получать уведомления о новых сообщениях"
          />
          <Switch
            edge="end"
            checked={settings.push.messages}
            onChange={handlePushChange('messages')}
            disabled={!pushSupported}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <EventIcon />
          </ListItemIcon>
          <ListItemText 
            primary="События" 
            secondary="Получать уведомления о важных датах и событиях"
          />
          <Switch
            edge="end"
            checked={settings.push.events}
            onChange={handlePushChange('events')}
            disabled={!pushSupported}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <NewReleasesIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Новости" 
            secondary="Получать уведомления о новостях и обновлениях приложения"
          />
          <Switch
            edge="end"
            checked={settings.push.news}
            onChange={handlePushChange('news')}
            disabled={!pushSupported}
          />
        </ListItem>
      </List>
    </Paper>
  );
};

export default NotificationSettings;

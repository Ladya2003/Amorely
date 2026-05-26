import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Switch,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import EventIcon from '@mui/icons-material/Event';
import NewReleasesIcon from '@mui/icons-material/NewReleases';

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
  onPushMasterToggle: (enabled: boolean) => void;
  isEnablingPush: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingChange,
  pushSupported,
  pushPermission,
  pushSubscribed,
  onPushMasterToggle,
  isEnablingPush
}) => {
  const handlePushChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onSettingChange('push', setting, event.target.checked);
  };

  const showPushOptions = pushSubscribed && pushPermission === 'granted';

  const handleMasterToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPushMasterToggle(event.target.checked);
  };
  
  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'transparent' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 400 }}>
        Уведомления
      </Typography>
      <Divider sx={{ mb: 3 }} />

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
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Включить" 
            secondary="Работает только с рабочего стола телефона"
          />
          <Switch
            edge="end"
            checked={showPushOptions}
            onChange={handleMasterToggle}
            disabled={!pushSupported || pushPermission === 'denied' || isEnablingPush}
          />
        </ListItem>

        {showPushOptions && (
          <>
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
              />
            </ListItem>
          </>
        )}
      </List>
    </Paper>
  );
};

export default NotificationSettings;

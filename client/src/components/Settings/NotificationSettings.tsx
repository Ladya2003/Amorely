import React from 'react';
import { useTranslation } from 'react-i18next';
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
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined';

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
      reports?: boolean;
    };
  };
  isAdmin?: boolean;
  onSettingChange: (type: 'email' | 'push', setting: string, value: boolean) => void;
  pushSupported: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  pushSubscribed: boolean;
  onPushMasterToggle: (enabled: boolean) => void;
  isEnablingPush: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  isAdmin = false,
  onSettingChange,
  pushSupported,
  pushPermission,
  pushSubscribed,
  onPushMasterToggle,
  isEnablingPush
}) => {
  const { t } = useTranslation();

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
        {t('settings.notifications.title')}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <List
        subheader={
          <ListSubheader component="div" sx={{ bgcolor: 'transparent' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">{t('settings.notifications.pushTitle')}</Typography>
            </Box>
          </ListSubheader>
        }
      >
        <ListItem>
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText 
            primary={t('settings.notifications.pushEnable')} 
            secondary={t('settings.notifications.pushEnableHint')}
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
                primary={t('settings.notifications.pushNewContent')} 
                secondary={t('settings.notifications.pushNewContentHint')}
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
                primary={t('settings.notifications.pushMessages')} 
                secondary={t('settings.notifications.pushMessagesHint')}
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
                primary={t('settings.notifications.pushEvents')} 
                secondary={t('settings.notifications.pushEventsHint')}
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
                primary={t('settings.notifications.pushNews')} 
                secondary={t('settings.notifications.pushNewsHint')}
              />
              <Switch
                edge="end"
                checked={settings.push.news}
                onChange={handlePushChange('news')}
              />
            </ListItem>
            {isAdmin && (
              <ListItem>
                <ListItemIcon>
                  <ReportOutlinedIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('settings.notifications.pushReports')}
                  secondary={t('settings.notifications.pushReportsHint')}
                />
                <Switch
                  edge="end"
                  checked={Boolean(settings.push.reports)}
                  onChange={handlePushChange('reports')}
                />
              </ListItem>
            )}
          </>
        )}
      </List>
    </Paper>
  );
};

export default NotificationSettings;

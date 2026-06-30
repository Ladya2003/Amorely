import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Box,
  Typography,
  Avatar,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAlerts } from '../../contexts/AdminAlertsContext';
import { getUserDisplayName } from '../UI/UserProfileChip';
import AvatarGameRankMedal from '../Games/AvatarGameRankMedal';
import { useRelationshipBadges } from '../../hooks/useRelationshipBadges';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { getFeedHeaderGlowSx } from './feedBannerStyles';

const AVATAR_SIZE_WITH_PHOTO = 92;
const AVATAR_SIZE_WITHOUT_PHOTO = 56;
const NOTIFICATION_SIZE_WITH_PHOTO = 38;
const NOTIFICATION_SIZE_WITHOUT_PHOTO = 30;
/** Наклон колокольчика — чуть вправо от вертикали */
const NOTIFICATION_BELL_ROTATE = '16deg';

const FeedHeader: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { badges } = useRelationshipBadges();
  const { feedDot } = useAdminAlerts();
  const isAdmin = user?.role === 'admin';
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  if (!user) {
    return null;
  }

  const hasAvatar = Boolean(user.avatar?.trim());
  const avatarSize = hasAvatar ? AVATAR_SIZE_WITH_PHOTO : AVATAR_SIZE_WITHOUT_PHOTO;
  const notificationSize = hasAvatar ? NOTIFICATION_SIZE_WITH_PHOTO : NOTIFICATION_SIZE_WITHOUT_PHOTO;

  const displayName = getUserDisplayName(user);

  const handleProfileClick = () => {
    navigate('/settings');
  };

  const handleGreetingClick = () => {
    if (isAdmin) {
      navigate('/admin');
    }
  };

  const greeting = (
    <Typography
      variant="h1"
      component="h1"
      onClick={handleGreetingClick}
      sx={{
        fontSize: { xs: '1.75rem', sm: '2rem' },
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '100%',
        ...(isAdmin && {
          cursor: 'pointer',
          '&:hover': { opacity: 0.85 },
        }),
      }}
    >
      {t('feed.greeting', { name: displayName })}
    </Typography>
  );

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={(theme) => getFeedHeaderGlowSx(theme, { bleed: true })}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              mb: 2.5,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, maxWidth: `calc(100% - ${avatarSize + 16}px)` }}>
              {isAdmin ? (
                <Badge
                  color="error"
                  variant="dot"
                  invisible={!feedDot}
                  overlap="rectangular"
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  sx={{
                    display: 'block',
                    maxWidth: '100%',
                    '& .MuiBadge-badge': {
                      top: 6,
                      right: -4,
                    },
                  }}
                >
                  {greeting}
                </Badge>
              ) : (
                greeting
              )}
            </Box>

            <Box
              sx={{
                position: 'relative',
                flexShrink: 0,
                width: avatarSize,
                height: avatarSize,
              }}
            >
              <AvatarGameRankMedal
                badges={badges}
                displayGameId={user.displayBadgeGameId}
                avatarSize={avatarSize}
              >
                <Avatar
                  src={hasAvatar ? user.avatar : undefined}
                  alt={displayName}
                  onClick={handleProfileClick}
                  sx={{
                    width: avatarSize,
                    height: avatarSize,
                    fontSize: hasAvatar ? undefined : '1.25rem',
                    cursor: 'pointer',
                    boxShadow: (theme) =>
                      theme.palette.mode === 'light'
                        ? '0 4px 16px rgba(0, 0, 0, 0.08)'
                        : '0 4px 16px rgba(0, 0, 0, 0.35)',
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </AvatarGameRankMedal>

              <IconButton
                aria-label={t('feed.notificationsAriaLabel')}
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationsOpen(true);
                }}
                sx={(theme) => ({
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: notificationSize,
                  height: notificationSize,
                  bgcolor: theme.palette.mode === 'light' ? '#1a1a1a' : '#2a2a2a',
                  color: '#fff',
                  border: `3px solid ${theme.palette.background.default}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'light' ? '#333' : '#3a3a3a',
                  },
                })}
              >
                <NotificationsNoneOutlinedIcon
                  sx={{
                    fontSize: hasAvatar ? 21 : 17,
                    transform: `rotate(${NOTIFICATION_BELL_ROTATE})`,
                    transformOrigin: 'center',
                  }}
                />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="h2" component="h2" sx={{ fontSize: '1.35rem' }}>
            {t('feed.title')}
          </Typography>
        </Box>
      </Box>

      <ResponsiveDialog
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('feed.notificationsDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
            {t('feed.notificationsDialog.empty')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationsOpen(false)} variant="contained">
            {t('feed.notificationsDialog.close')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </Box>  );
};

export default FeedHeader;

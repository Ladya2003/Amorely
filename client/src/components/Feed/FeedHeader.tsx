import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAlerts } from '../../contexts/AdminAlertsContext';
import { getUserDisplayName } from '../UI/UserProfileChip';
import AvatarGameRankMedal from '../Games/AvatarGameRankMedal';
import { useRelationshipBadges } from '../../hooks/useRelationshipBadges';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { getFeedHeaderGlowSx } from './feedBannerStyles';
import { fetchAnnouncements, type AppAnnouncement } from '../../services/announcementsService';
import {
  addReadAnnouncementKey,
  readReadAnnouncementKeys,
} from '../../utils/readAnnouncementsStorage';

const AVATAR_SIZE_WITH_PHOTO = 92;
const AVATAR_SIZE_WITHOUT_PHOTO = 56;
const NOTIFICATION_SIZE_WITH_PHOTO = 38;
const NOTIFICATION_SIZE_WITHOUT_PHOTO = 30;
const NOTIFICATION_BELL_ROTATE = '16deg';

type NotificationsView = 'list' | 'detail';

const FeedHeader: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { badges } = useRelationshipBadges();
  const { feedDot } = useAdminAlerts();
  const isAdmin = user?.role === 'admin';
  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [readKeys, setReadKeys] = useState<Set<string>>(() =>
    user?._id ? readReadAnnouncementKeys(user._id) : new Set()
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsView, setNotificationsView] = useState<NotificationsView>('list');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AppAnnouncement | null>(null);

  const loadAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      const items = await fetchAnnouncements();
      setAnnouncements(items);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    if (!user?._id) {
      return;
    }
    setReadKeys(readReadAnnouncementKeys(user._id));
  }, [user?._id]);

  const markAnnouncementRead = useCallback(
    (announcementKey: string) => {
      if (!user?._id) {
        return;
      }
      setReadKeys(addReadAnnouncementKey(user._id, announcementKey));
    },
    [user?._id]
  );

  const unreadCount = useMemo(
    () => announcements.filter((item) => !readKeys.has(item.key)).length,
    [announcements, readKeys]
  );

  const openAnnouncementDetail = useCallback(
    (announcement: AppAnnouncement) => {
      setSelectedAnnouncement(announcement);
      setNotificationsView('detail');
      markAnnouncementRead(announcement.key);
    },
    [markAnnouncementRead]
  );

  useEffect(() => {
    const announcementKey = searchParams.get('announcement');
    if (!announcementKey || announcementsLoading) {
      return;
    }

    const match = announcements.find((item) => item.key === announcementKey);
    if (!match) {
      return;
    }

    setNotificationsOpen(true);
    openAnnouncementDetail(match);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('announcement');
    setSearchParams(nextParams, { replace: true });
  }, [
    announcements,
    announcementsLoading,
    openAnnouncementDetail,
    searchParams,
    setSearchParams,
  ]);

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

  const handleOpenNotifications = () => {
    setNotificationsView('list');
    setSelectedAnnouncement(null);
    setNotificationsOpen(true);
  };

  const handleCloseNotifications = () => {
    setNotificationsOpen(false);
    setNotificationsView('list');
    setSelectedAnnouncement(null);
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
                showBadge={user.showDisplayBadge !== false}
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

              <Badge
                color="error"
                variant="dot"
                invisible={announcementsLoading || unreadCount === 0}
                overlap="circular"
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  '& .MuiBadge-badge': {
                    top: 4,
                    right: 4,
                    boxShadow: '0 0 0 2px var(--mui-palette-background-default, #fff)',
                  },
                }}
              >
                <IconButton
                  aria-label={t('feed.notificationsAriaLabel')}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenNotifications();
                  }}
                  sx={(theme) => ({
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
                  {announcementsLoading ? (
                    <CircularProgress size={hasAvatar ? 16 : 14} sx={{ color: '#fff' }} />
                  ) : (
                    <NotificationsNoneOutlinedIcon
                      sx={{
                        fontSize: hasAvatar ? 21 : 17,
                        transform: `rotate(${NOTIFICATION_BELL_ROTATE})`,
                        transformOrigin: 'center',
                      }}
                    />
                  )}
                </IconButton>
              </Badge>
            </Box>
          </Box>

          <Typography variant="h2" component="h2" sx={{ fontSize: '1.35rem' }}>
            {t('feed.title')}
          </Typography>
        </Box>
      </Box>

      <ResponsiveDialog
        open={notificationsOpen}
        onClose={handleCloseNotifications}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          {notificationsView === 'detail' && (
            <IconButton
              aria-label={t('feed.notificationsDialog.back')}
              onClick={() => {
                setNotificationsView('list');
                setSelectedAnnouncement(null);
              }}
              size="small"
              sx={{ ml: -0.5 }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Box component="span" sx={{ flex: 1 }}>
            {notificationsView === 'detail' && selectedAnnouncement
              ? selectedAnnouncement.title
              : t('feed.notificationsDialog.title')}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: notificationsView === 'detail' ? 1 : 0 }}>
          {notificationsView === 'list' ? (
            <>
              {announcementsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : announcements.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
                  {t('feed.notificationsDialog.empty')}
                </Typography>
              ) : (
                <List disablePadding>
                  {announcements.map((announcement) => {
                    const isUnread = !readKeys.has(announcement.key);
                    return (
                      <ListItemButton
                        key={announcement.key}
                        onClick={() => openAnnouncementDetail(announcement)}
                        sx={{ px: 0, py: 1.25, alignItems: 'flex-start' }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography component="span" variant="subtitle2" fontWeight={700}>
                                {announcement.title}
                              </Typography>
                              {isUnread && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{
                                    px: 0.75,
                                    py: 0.15,
                                    borderRadius: 999,
                                    bgcolor: 'error.main',
                                    color: 'error.contrastText',
                                    fontWeight: 700,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {t('feed.notificationsDialog.newBadge')}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={announcement.preview}
                          slotProps={{
                            secondary: {
                              sx: { mt: 0.5, whiteSpace: 'normal' },
                            },
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </>
          ) : (
            selectedAnnouncement && (
              <Typography
                variant="body1"
                color="text.primary"
                sx={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}
              >
                {selectedAnnouncement.content}
              </Typography>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotifications} variant="contained">
            {t('feed.notificationsDialog.close')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>
    </Box>
  );
};

export default FeedHeader;

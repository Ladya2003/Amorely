import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  useTheme,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStatusBubbles } from '../../hooks/useStatusBubbles';
import { useRelationshipBadges } from '../../hooks/useRelationshipBadges';
import { getUserDisplayName } from '../UI/UserProfileChip';
import AvatarGameRankMedal from '../Games/AvatarGameRankMedal';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import ContactProfileDialog from '../Chat/ContactProfileDialog';
import type { Contact } from '../Chat/ChatList';
import type { Partner } from '../Settings/PartnerForm';
import {
  getNotificationBellButtonAnimSx,
  getNotificationBellIconSx,
} from './feedBannerStyles';
import {
  COUPLE_AVATAR_SIZE,
  getCoupleAvatarsLoaderSx,
  getCoupleAvatarsRootSx,
  getCoupleAvatarsRowSx,
  getCoupleAvatarSx,
  getCoupleBubbleItemSx,
  getCoupleBubblesStackSx,
  getCouplePartnerAvatarWrapSx,
  getCoupleUserAvatarWrapSx,
  getThoughtBubbleBodySx,
} from './feedCoupleAvatarsStyles';

const NOTIFICATION_SIZE = 30;
const NOTIFICATION_ICON_SIZE = 17;

interface StatusThoughtBubbleProps {
  text: string;
  editable?: boolean;
  ariaLabel?: string;
  onClick?: () => void;
}

const StatusThoughtBubble: React.FC<StatusThoughtBubbleProps> = ({
  text,
  editable = false,
  ariaLabel,
  onClick,
}) => {
  const theme = useTheme();

  return (
    <Box
      component={editable ? 'button' : 'span'}
      type={editable ? 'button' : undefined}
      onClick={editable ? onClick : undefined}
      aria-label={ariaLabel}
      title={text}
      sx={{
        ...getThoughtBubbleBodySx(theme, editable),
        ...(editable && { fontFamily: 'inherit' }),
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {text}
      </Box>
    </Box>
  );
};

export const FeedCoupleAvatarsLoader: React.FC = () => (
  <Box sx={getCoupleAvatarsLoaderSx()} aria-busy="true" aria-label="Loading">
    <CircularProgress size={28} />
  </Box>
);

interface FeedCoupleAvatarsProps {
  partner: Partner;
  announcementsLoading: boolean;
  unreadCount: number;
  hasUnreadNotifications: boolean;
  onOpenNotifications: () => void;
}

const FeedCoupleAvatars: React.FC<FeedCoupleAvatarsProps> = ({
  partner,
  announcementsLoading,
  unreadCount,
  hasUnreadNotifications,
  onOpenNotifications,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { badges } = useRelationshipBadges();
  const { myBubbleText, partnerBubbleText, isSaving, updateStatusBubble } = useStatusBubbles();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const partnerContact: Contact = useMemo(() => {
    const partnerDisplayName = getUserDisplayName(partner);

    return {
      id: partner._id,
      isPartner: true,
      name: partnerDisplayName,
      firstName: partner.firstName,
      lastName: partner.lastName,
      username: partner.username,
      email: partner.email,
      avatar: partner.avatar || '',
      lastMessage: { text: '', timestamp: '', isRead: true },
    };
  }, [partner]);

  if (!user) {
    return null;
  }

  const userDisplayName = getUserDisplayName(user);
  const partnerDisplayName = getUserDisplayName(partner);
  const userHasAvatar = Boolean(user.avatar?.trim());
  const partnerHasAvatar = Boolean(partner.avatar?.trim());

  const myDisplayText = myBubbleText.trim() || t('feed.statusBubble.placeholder');
  const partnerDisplayText = partnerBubbleText.trim() || t('feed.statusBubble.partnerPlaceholder');
  const partnerBubbleAriaLabel = t('feed.statusBubble.partnerBubbleAriaLabel', {
    name: partnerDisplayName,
  });

  const handleOpenEdit = () => {
    setEditText(myBubbleText);
    setEditDialogOpen(true);
  };

  const handleSaveBubble = async () => {
    const success = await updateStatusBubble(editText);
    if (success) {
      setEditDialogOpen(false);
    }
  };

  return (
    <>
      <Box sx={getCoupleAvatarsRootSx()}>
        <Box sx={getCoupleBubblesStackSx()}>
          <Box sx={getCoupleBubbleItemSx('right')}>
            <StatusThoughtBubble
              text={partnerDisplayText}
              ariaLabel={partnerBubbleAriaLabel}
            />
          </Box>
          <Box sx={getCoupleBubbleItemSx('left')}>
            <StatusThoughtBubble
              text={myDisplayText}
              editable
              ariaLabel={t('feed.statusBubble.editAriaLabel')}
              onClick={handleOpenEdit}
            />
          </Box>
        </Box>

        <Box sx={getCoupleAvatarsRowSx()}>
          <Box sx={getCoupleUserAvatarWrapSx()}>
            <AvatarGameRankMedal
              badges={badges}
              displayGameId={user.displayBadgeGameId}
              showBadge={user.showDisplayBadge !== false}
              avatarSize={COUPLE_AVATAR_SIZE}
            >
              <Avatar
                src={userHasAvatar ? user.avatar : undefined}
                alt={userDisplayName}
                onClick={() => navigate('/settings')}
                sx={{
                  ...getCoupleAvatarSx(theme, 2),
                  cursor: 'pointer',
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
                zIndex: 5,
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
                  onOpenNotifications();
                }}
                sx={(t) => ({
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  zIndex: 5,
                  width: NOTIFICATION_SIZE,
                  height: NOTIFICATION_SIZE,
                  bgcolor: t.palette.mode === 'light' ? '#1a1a1a' : '#2a2a2a',
                  color: '#fff',
                  border: `3px solid ${t.palette.background.default}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
                  '&:hover': {
                    bgcolor: t.palette.mode === 'light' ? '#333' : '#3a3a3a',
                  },
                  ...getNotificationBellButtonAnimSx(hasUnreadNotifications),
                })}
              >
                {announcementsLoading ? (
                  <CircularProgress size={14} sx={{ color: '#fff' }} />
                ) : (
                  <NotificationsNoneOutlinedIcon
                    sx={getNotificationBellIconSx(NOTIFICATION_ICON_SIZE, hasUnreadNotifications)}
                  />
                )}
              </IconButton>
            </Badge>
          </Box>

          <Box sx={getCouplePartnerAvatarWrapSx()}>
            <Avatar
              src={partnerHasAvatar ? partner.avatar : undefined}
              alt={partnerDisplayName}
              onClick={() => setProfileDialogOpen(true)}
              sx={{
                ...getCoupleAvatarSx(theme, 1),
                cursor: 'pointer',
              }}
            >
              {partner.username.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Box>
      </Box>

      <ResponsiveDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('feed.statusBubble.editTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            value={editText}
            onChange={(e) => setEditText(e.target.value.slice(0, 100))}
            placeholder={t('feed.statusBubble.placeholder')}
            helperText={t('feed.statusBubble.editHint')}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={isSaving}>
            {t('feed.statusBubble.cancel')}
          </Button>
          <Button onClick={() => void handleSaveBubble()} variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} /> : t('feed.statusBubble.save')}
          </Button>
        </DialogActions>
      </ResponsiveDialog>

      <ContactProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        contact={partnerContact}
      />
    </>
  );
};

export default FeedCoupleAvatars;

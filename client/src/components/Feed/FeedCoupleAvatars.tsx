import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStatusBubbles } from '../../hooks/useStatusBubbles';
import { useRelationshipBadges } from '../../hooks/useRelationshipBadges';
import { getUserDisplayName } from '../UI/UserProfileChip';
import AvatarGameRankMedal from '../Games/AvatarGameRankMedal';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import ContactProfileDialog from '../Chat/ContactProfileDialog';
import CoupleDistanceDialog from './CoupleDistanceDialog';
import type { Contact } from '../Chat/ChatList';
import type { Partner } from '../Settings/PartnerForm';
import { fetchCoupleDistanceStatus } from '../../services/coupleDistanceService';
import { formatDistanceKm } from '../../utils/geoDistance';
import {
  COUPLE_AVATAR_SIZE,
  getCoupleAvatarColumnSx,
  getCoupleAvatarSx,
  getCoupleAvatarsLoaderSx,
  getCoupleAvatarsRootSx,
  getCoupleAvatarsRowSx,
  getCoupleBubbleAboveAvatarSx,
  getCoupleConnectorSx,
  getCoupleLockBadgeSx,
  getCoupleUserAvatarWrapSx,
  getThoughtBubbleBodySx,
} from './feedCoupleAvatarsStyles';

interface StatusThoughtBubbleProps {
  text: string;
  editable?: boolean;
  tailAlign?: 'left' | 'right';
  ariaLabel?: string;
  onClick?: () => void;
}

const StatusThoughtBubble: React.FC<StatusThoughtBubbleProps> = ({
  text,
  editable = false,
  tailAlign = 'left',
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
        ...getThoughtBubbleBodySx(theme, editable, tailAlign),
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

interface CoupleConnectorProps {
  theme: Theme;
  distanceKm: number | null;
  onOpenDistance: () => void;
  lockAriaLabel: string;
}

const CoupleConnector: React.FC<CoupleConnectorProps> = ({
  theme,
  distanceKm,
  onOpenDistance,
  lockAriaLabel,
}) => {
  const isLight = theme.palette.mode === 'light';
  const strokeColor = isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
  const distanceLabel =
    distanceKm != null ? `${formatDistanceKm(distanceKm)} km` : 'km';

  return (
    <Box sx={getCoupleConnectorSx()} aria-hidden={false}>
      <Box
        component="svg"
        viewBox="0 0 160 56"
        preserveAspectRatio="none"
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <path
          d="M 0 50 Q 80 6 80 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
        <path
          d="M 160 50 Q 80 6 80 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
      </Box>
      <Box
        component="button"
        type="button"
        onClick={onOpenDistance}
        aria-label={lockAriaLabel}
        sx={getCoupleLockBadgeSx(theme, true)}
      >
        <LockOutlinedIcon sx={{ fontSize: 16, color: '#6b4c9a' }} />
        <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 1 }}>
          {distanceLabel}
        </Typography>
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
}

const FeedCoupleAvatars: React.FC<FeedCoupleAvatarsProps> = ({ partner }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { badges } = useRelationshipBadges();
  const { myBubbleText, partnerBubbleText, isSaving, updateStatusBubble } = useStatusBubbles();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [distanceDialogOpen, setDistanceDialogOpen] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

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

  useEffect(() => {
    let cancelled = false;

    const loadDistance = async () => {
      try {
        const status = await fetchCoupleDistanceStatus();
        if (!cancelled) {
          setDistanceKm(status.distanceKm);
        }
      } catch {
        if (!cancelled) {
          setDistanceKm(null);
        }
      }
    };

    void loadDistance();

    return () => {
      cancelled = true;
    };
  }, [partner._id]);

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
        <Box sx={getCoupleAvatarsRowSx()}>
          <Box sx={getCoupleAvatarColumnSx('left')}>
            <Box sx={getCoupleBubbleAboveAvatarSx('left')}>
              <StatusThoughtBubble
                text={myDisplayText}
                editable
                tailAlign="left"
                ariaLabel={t('feed.statusBubble.editAriaLabel')}
                onClick={handleOpenEdit}
              />
            </Box>
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
                    ...getCoupleAvatarSx(theme),
                    cursor: 'pointer',
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </AvatarGameRankMedal>
            </Box>
          </Box>

          <CoupleConnector
            theme={theme}
            distanceKm={distanceKm}
            onOpenDistance={() => setDistanceDialogOpen(true)}
            lockAriaLabel={t('feed.coupleDistance.lockAriaLabel')}
          />

          <Box sx={getCoupleAvatarColumnSx('right')}>
            <Box sx={getCoupleBubbleAboveAvatarSx('right')}>
              <StatusThoughtBubble
                text={partnerDisplayText}
                tailAlign="right"
                ariaLabel={partnerBubbleAriaLabel}
              />
            </Box>
            <AvatarGameRankMedal
              badges={badges}
              displayGameId={partner.displayBadgeGameId}
              showBadge={partner.showDisplayBadge !== false}
              avatarSize={COUPLE_AVATAR_SIZE}
            >
              <Avatar
                src={partnerHasAvatar ? partner.avatar : undefined}
                alt={partnerDisplayName}
                onClick={() => setProfileDialogOpen(true)}
                sx={{
                  ...getCoupleAvatarSx(theme),
                  cursor: 'pointer',
                }}
              >
                {partner.username.charAt(0).toUpperCase()}
              </Avatar>
            </AvatarGameRankMedal>
          </Box>
        </Box>
      </Box>

      <CoupleDistanceDialog
        open={distanceDialogOpen}
        onClose={() => setDistanceDialogOpen(false)}
        partnerName={partnerDisplayName}
        onDistanceUpdated={setDistanceKm}
      />

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

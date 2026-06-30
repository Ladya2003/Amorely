import React from 'react';
import { Box, Typography, Avatar, SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AvatarGameRankMedal from '../Games/AvatarGameRankMedal';
import { useRelationshipBadges } from '../../hooks/useRelationshipBadges';

export const getUserDisplayName = (user: {
  username: string;
  firstName?: string;
  lastName?: string;
}) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.username;
};

interface UserProfileChipProps {
  sx?: SxProps<Theme>;
  maxNameWidth?: number | string;
}

const UserProfileChip: React.FC<UserProfileChipProps> = ({
  sx,
  maxNameWidth = 96,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { badges } = useRelationshipBadges();

  if (!user) {
    return null;
  }

  return (
    <Box
      onClick={() => navigate('/settings')}
      sx={[
        (theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          borderRadius: 999,
          py: 0.25,
          pl: 0.25,
          pr: 1.25,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
          width: 'fit-content',
          maxWidth: '100%',
          flexShrink: 0,
        }),
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <AvatarGameRankMedal
        badges={badges}
        displayGameId={user.displayBadgeGameId}
        avatarSize={40}
      >
        <Avatar
          src={user.avatar}
          alt={getUserDisplayName(user)}
          sx={{ width: 40, height: 40, flexShrink: 0 }}
        >
          {user.username.charAt(0).toUpperCase()}
        </Avatar>
      </AvatarGameRankMedal>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          minWidth: 0,
          maxWidth: maxNameWidth,
        }}
      >
        <Typography variant="body2" noWrap component="span" sx={{ fontWeight: 500 }}>
          {getUserDisplayName(user)}
        </Typography>
      </Box>
    </Box>
  );
};

export default UserProfileChip;

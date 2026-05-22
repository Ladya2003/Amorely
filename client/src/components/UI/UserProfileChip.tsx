import React from 'react';
import { Box, Typography, Avatar, SxProps, Theme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

  if (!user) {
    return null;
  }

  return (
    <Box
      onClick={() => navigate('/settings')}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        borderRadius: 999,
        py: 0.25,
        pl: 0.25,
        pr: 1.25,
        bgcolor: 'rgba(255, 75, 141, 0.1)',
        '&:hover': { bgcolor: 'rgba(255, 75, 141, 0.2)' },
        minWidth: 0,
        flexShrink: 0,
        ...sx,
      }}
    >
      <Avatar
        src={user.avatar}
        alt={getUserDisplayName(user)}
        sx={{ width: 40, height: 40, flexShrink: 0 }}
      >
        {user.username.charAt(0).toUpperCase()}
      </Avatar>
      <Typography
        variant="body2"
        noWrap
        sx={{ fontWeight: 500, minWidth: 0, maxWidth: maxNameWidth }}
      >
        {getUserDisplayName(user)}
      </Typography>
    </Box>
  );
};

export default UserProfileChip;

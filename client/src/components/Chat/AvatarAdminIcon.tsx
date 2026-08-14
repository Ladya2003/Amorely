import React from 'react';
import { Box, useTheme } from '@mui/material';

export const shouldShowAdminAvatarIcon = (user?: {
  role?: string;
  showAdminIcon?: boolean;
} | null): boolean => Boolean(user && user.role === 'admin' && user.showAdminIcon !== false);

export const getAdminIconSizeForAvatar = (avatarSize: number) =>
  Math.min(20, Math.max(14, Math.round(avatarSize * 0.34)));

interface AdminBadgeIconProps {
  size?: number;
}

export const AdminBadgeIcon: React.FC<AdminBadgeIconProps> = ({ size = 20 }) => {
  const theme = useTheme();
  const badgeColor = theme.palette.primary.main;
  const badgeContrast = theme.palette.primary.contrastText;

  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: size,
        height: size,
        display: 'inline-flex',
        flexShrink: 0,
        lineHeight: 0,
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.28))',
      }}
    >
      <svg viewBox="0 0 20 20" width={size} height={size} fill="none">
        <circle cx="10" cy="10" r="9" fill={badgeColor} />
        <circle cx="10" cy="10" r="9" fill="none" stroke={badgeContrast} strokeWidth="1.6" />
        <path
          d="M10 4.1 15.1 6.2v4.1c0 3.05-2.2 5.45-5.1 6.2-2.9-.75-5.1-3.15-5.1-6.2V6.2L10 4.1Z"
          fill={badgeContrast}
        />
        <path
          d="M10 6.15 13.35 7.5v2.55c0 1.95-1.4 3.5-3.35 4.05-1.95-.55-3.35-2.1-3.35-4.05V7.5L10 6.15Z"
          fill={badgeColor}
        />
        <path
          d="M10 8.05 11.55 9.2l-.4 1.75L10 10.3l-1.15.65-.4-1.75L10 8.05Z"
          fill={badgeContrast}
        />
      </svg>
    </Box>
  );
};

interface AvatarAdminIconProps {
  show?: boolean;
  avatarSize?: number;
  children: React.ReactNode;
}

const AvatarAdminIcon: React.FC<AvatarAdminIconProps> = ({
  show = false,
  avatarSize = 44,
  children,
}) => {
  if (!show) {
    return <>{children}</>;
  }

  const size = getAdminIconSizeForAvatar(avatarSize);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      {children}
      <Box
        sx={{
          position: 'absolute',
          bottom: -2,
          left: -2,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <AdminBadgeIcon size={size} />
      </Box>
    </Box>
  );
};

export default AvatarAdminIcon;

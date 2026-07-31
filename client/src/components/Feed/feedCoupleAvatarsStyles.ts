import { alpha, Theme } from '@mui/material/styles';

export const COUPLE_AVATAR_SIZE = 64;
export const COUPLE_AVATAR_OVERLAP = 14;
export const STATUS_BUBBLE_MAX_WIDTH = 88;

export const getCoupleAvatarsRootSx = () => ({
  position: 'relative' as const,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
});

export const getCoupleBubblesRowSx = () => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: 0.5,
  mb: 0.75,
  width: '100%',
});

export const getStatusBubbleSx = (theme: Theme, editable: boolean) => {
  const isLight = theme.palette.mode === 'light';

  return {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: STATUS_BUBBLE_MAX_WIDTH,
    px: 1.25,
    py: 0.625,
    borderRadius: '14px',
    bgcolor: isLight ? theme.palette.common.white : alpha(theme.palette.common.white, 0.95),
    color: isLight ? '#3d2c5c' : theme.palette.text.primary,
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.3,
    boxShadow: isLight
      ? `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`
      : `0 2px 12px ${alpha(theme.palette.common.black, 0.35)}`,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    cursor: editable ? 'pointer' : 'default',
    transition: 'transform 150ms ease, box-shadow 150ms ease',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -5,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
      borderTop: `5px solid ${isLight ? theme.palette.common.white : alpha(theme.palette.common.white, 0.95)}`,
    },
    ...(editable && {
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: isLight
          ? `0 4px 14px ${alpha(theme.palette.common.black, 0.14)}`
          : `0 4px 16px ${alpha(theme.palette.common.black, 0.4)}`,
      },
    }),
  };
};

export const getCoupleAvatarsRowSx = () => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const getCoupleAvatarSx = (theme: Theme, zIndex: number) => ({
  width: COUPLE_AVATAR_SIZE,
  height: COUPLE_AVATAR_SIZE,
  fontSize: '1.125rem',
  border: `3px solid ${theme.palette.background.default}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? '0 4px 16px rgba(0, 0, 0, 0.1)'
      : '0 4px 16px rgba(0, 0, 0, 0.35)',
  zIndex,
  position: 'relative' as const,
});

export const getCouplePartnerAvatarWrapSx = () => ({
  ml: `-${COUPLE_AVATAR_OVERLAP}px`,
});

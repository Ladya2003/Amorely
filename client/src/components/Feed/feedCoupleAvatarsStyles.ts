import { alpha, Theme } from '@mui/material/styles';

export const COUPLE_AVATAR_SIZE = 64;
export const COUPLE_AVATAR_OVERLAP = 14;
export const COUPLE_AVATARS_WIDTH = 196;
export const COUPLE_AVATARS_HEIGHT = 112;
export const STATUS_BUBBLE_MAX_WIDTH = 118;

const getBubbleSurface = (theme: Theme) => {
  const isLight = theme.palette.mode === 'light';

  return {
    bgcolor: isLight ? theme.palette.common.white : alpha(theme.palette.common.white, 0.1),
    border: isLight ? 'none' : `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
    color: isLight ? '#3d2c5c' : theme.palette.text.primary,
    shadow: isLight
      ? `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`
      : `0 2px 12px ${alpha(theme.palette.common.black, 0.28)}`,
  };
};

export const getCoupleAvatarsRootSx = () => ({
  position: 'relative' as const,
  flexShrink: 0,
  width: COUPLE_AVATARS_WIDTH,
  minHeight: COUPLE_AVATARS_HEIGHT,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'flex-end',
});

export const getCoupleAvatarsLoaderSx = () => ({
  width: COUPLE_AVATARS_WIDTH,
  minHeight: COUPLE_AVATARS_HEIGHT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const getCoupleAvatarsRowSx = () => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  width: '100%',
});

export const getCoupleAvatarColumnSx = (side: 'left' | 'right') => ({
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  ...(side === 'right' && {
    ml: `-${COUPLE_AVATAR_OVERLAP}px`,
  }),
});

export const getThoughtBubbleWrapSx = (theme: Theme, side: 'left' | 'right') => ({
  position: 'absolute' as const,
  bottom: `calc(100% - 6px)`,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  zIndex: 3,
  pointerEvents: 'none' as const,
  ...(side === 'left'
    ? { left: '50%', transform: 'translateX(calc(-50% - 10px))' }
    : { left: '50%', transform: 'translateX(calc(-50% + 10px))' }),
});

export const getThoughtBubbleBodySx = (theme: Theme, editable: boolean) => {
  const surface = getBubbleSurface(theme);

  return {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: STATUS_BUBBLE_MAX_WIDTH,
    minWidth: 36,
    px: 1.5,
    py: 0.75,
    borderRadius: '16px',
    bgcolor: surface.bgcolor,
    border: surface.border,
    color: surface.color,
    fontSize: '0.8125rem',
    fontWeight: 600,
    lineHeight: 1.25,
    boxShadow: surface.shadow,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    pointerEvents: editable ? ('auto' as const) : ('none' as const),
    cursor: editable ? 'pointer' : 'default',
    transition: 'transform 150ms ease, box-shadow 150ms ease',
    ...(editable && {
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: theme.palette.mode === 'light'
          ? `0 4px 14px ${alpha(theme.palette.common.black, 0.14)}`
          : `0 4px 16px ${alpha(theme.palette.common.black, 0.36)}`,
      },
    }),
  };
};

export const getThoughtBubbleTrailSx = (theme: Theme, side: 'left' | 'right') => {
  const surface = getBubbleSurface(theme);

  return {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    mt: 0.25,
    transform: side === 'left' ? 'translateX(-4px)' : 'translateX(4px)',
    '& .thought-bubble-dot-lg': {
      width: 9,
      height: 9,
      borderRadius: '50%',
      bgcolor: surface.bgcolor,
      border: surface.border,
      boxShadow: surface.shadow,
    },
    '& .thought-bubble-dot-sm': {
      width: 5,
      height: 5,
      borderRadius: '50%',
      bgcolor: surface.bgcolor,
      border: surface.border,
      mt: '-2px',
    },
  };
};

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

export const getCoupleUserAvatarWrapSx = () => ({
  position: 'relative' as const,
});

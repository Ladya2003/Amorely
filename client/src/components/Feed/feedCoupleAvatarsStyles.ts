import { alpha, Theme } from '@mui/material/styles';

export const COUPLE_AVATAR_SIZE = 72;
export const STATUS_BUBBLE_MAX_WIDTH = 148;
export const COUPLE_ROW_MAX_WIDTH = 360;
export const COUPLE_BUBBLES_TOP_INSET = 56;

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
  width: '100%',
  maxWidth: COUPLE_ROW_MAX_WIDTH,
  mx: 'auto',
  pt: `${COUPLE_BUBBLES_TOP_INSET}px`,
  overflow: 'visible' as const,
});

export const getCoupleAvatarsLoaderSx = () => ({
  width: '100%',
  maxWidth: COUPLE_ROW_MAX_WIDTH,
  height: COUPLE_AVATAR_SIZE + COUPLE_BUBBLES_TOP_INSET,
  mx: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const getCoupleAvatarsRowSx = () => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 0.5,
  position: 'relative' as const,
});

export const getCoupleAvatarColumnSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  flexShrink: 0,
  position: 'relative' as const,
  width: COUPLE_AVATAR_SIZE,
});

export const getCoupleBubbleAboveAvatarSx = () => ({
  position: 'absolute' as const,
  bottom: `calc(100% + 8px)`,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'max-content',
  maxWidth: STATUS_BUBBLE_MAX_WIDTH,
  zIndex: 2,
});

export const getCoupleConnectorSx = () => ({
  flex: 1,
  position: 'relative' as const,
  alignSelf: 'center',
  minWidth: 48,
  height: 48,
  mx: 0.5,
  pointerEvents: 'none' as const,
});

export const getCoupleLockBadgeSx = (theme: Theme) => {
  const isLight = theme.palette.mode === 'light';

  return {
    position: 'absolute' as const,
    top: -2,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1.25,
    py: 0.5,
    borderRadius: 999,
    bgcolor: isLight ? theme.palette.common.white : alpha(theme.palette.common.white, 0.12),
    border: isLight ? 'none' : `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
    boxShadow: isLight
      ? `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`
      : `0 2px 12px ${alpha(theme.palette.common.black, 0.28)}`,
    color: '#6b4c9a',
    fontSize: '0.8125rem',
    fontWeight: 700,
    lineHeight: 1,
    zIndex: 3,
  };
};

export const getThoughtBubbleBodySx = (theme: Theme, editable: boolean) => {
  const surface = getBubbleSurface(theme);

  return {
    position: 'relative' as const,
    display: 'inline-block',
    boxSizing: 'border-box' as const,
    maxWidth: STATUS_BUBBLE_MAX_WIDTH,
    verticalAlign: 'top',
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
    overflow: 'visible',
    textAlign: 'left' as const,
    direction: 'ltr' as const,
    pointerEvents: editable ? ('auto' as const) : ('none' as const),
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
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderTop: `6px solid ${surface.bgcolor}`,
    },
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

export const getCoupleAvatarSx = (theme: Theme) => ({
  width: COUPLE_AVATAR_SIZE,
  height: COUPLE_AVATAR_SIZE,
  fontSize: '1.25rem',
  border: `3px solid ${theme.palette.background.default}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? '0 4px 16px rgba(0, 0, 0, 0.1)'
      : '0 4px 16px rgba(0, 0, 0, 0.35)',
  position: 'relative' as const,
});

export const getCoupleUserAvatarWrapSx = () => ({
  position: 'relative' as const,
  flexShrink: 0,
});

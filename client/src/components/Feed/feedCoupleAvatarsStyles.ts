import { alpha, Theme } from '@mui/material/styles';

export const COUPLE_AVATAR_SIZE = 64;
export const COUPLE_AVATAR_OVERLAP = 14;
export const COUPLE_AVATAR_ROW_WIDTH = COUPLE_AVATAR_SIZE * 2 - COUPLE_AVATAR_OVERLAP;
export const STATUS_BUBBLE_MAX_WIDTH = 148;
/** Отступ сверху под стек из двух облачков */
export const COUPLE_BUBBLES_TOP_INSET = 72;

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

/** Корневой блок — только ширина/высота ряда аватаров; облачка не влияют на layout */
export const getCoupleAvatarsRootSx = () => ({
  position: 'relative' as const,
  flexShrink: 0,
  width: COUPLE_AVATAR_ROW_WIDTH,
  height: COUPLE_AVATAR_SIZE,
  overflow: 'visible' as const,
});

export const getCoupleAvatarsLoaderSx = () => ({
  width: COUPLE_AVATAR_ROW_WIDTH,
  height: COUPLE_AVATAR_SIZE,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const getCoupleAvatarsRowSx = () => ({
  display: 'flex',
  alignItems: 'center',
  height: '100%',
});

export const getCouplePartnerAvatarWrapSx = () => ({
  ml: `-${COUPLE_AVATAR_OVERLAP}px`,
});

/** Стек облачков над аватарами — партнёр сверху, пользователь снизу, с gap */
export const getCoupleBubblesStackSx = () => ({
  position: 'absolute' as const,
  right: 0,
  bottom: '100%',
  width: STATUS_BUBBLE_MAX_WIDTH,
  mb: 0.5,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1,
  zIndex: 4,
  pointerEvents: 'none' as const,
});

export const getCoupleBubbleItemSx = (align: 'left' | 'right') => ({
  alignSelf: align === 'right' ? 'flex-end' : 'flex-start',
  maxWidth: '100%',
  pointerEvents: 'auto' as const,
});

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
    overflow: 'hidden',
    textAlign: 'left' as const,
    direction: 'ltr' as const,
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
  flexShrink: 0,
});

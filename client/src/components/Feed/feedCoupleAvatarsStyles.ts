import { alpha, lighten, Theme } from '@mui/material/styles';

export const COUPLE_AVATAR_SIZE = 72;
export const STATUS_BUBBLE_MAX_WIDTH = 148;
export const COUPLE_ROW_MAX_WIDTH = 360;
export const COUPLE_BUBBLES_TOP_INSET = 56;

/** Акцент для бейджа расстояния: читаемый на белом и тёмном paper. */
export const getCoupleDistanceAccentColor = (theme: Theme) => {
  if (theme.palette.mode === 'light') {
    // primary.dark даёт лучший контраст ярких акцентов (pink/orange) на белом
    return theme.palette.primary.dark;
  }
  // В тёмной теме primary.main приглушён — слегка осветляем для мелкого текста
  return lighten(theme.palette.primary.main, 0.42);
};

const getBubbleSurface = (theme: Theme) => {
  const isLight = theme.palette.mode === 'light';

  return {
    // Непрозрачная заливка: иначе сквозь облако и хвостик просвечивает фон
    bgcolor: isLight ? theme.palette.common.white : theme.palette.background.paper,
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

export const getCoupleAvatarsRowSx = () => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: 2,
  position: 'relative' as const,
});

export const getCoupleAvatarColumnSx = (align: 'left' | 'right') => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: align === 'left' ? ('flex-start' as const) : ('flex-end' as const),
  flexShrink: 0,
  position: 'relative' as const,
  width: COUPLE_AVATAR_SIZE,
});

export const getCoupleBubbleAboveAvatarSx = (align: 'left' | 'right') => ({
  position: 'absolute' as const,
  bottom: `calc(100% + 8px)`,
  ...(align === 'left' ? { left: 0 } : { right: 0 }),
  width: 'max-content',
  maxWidth: STATUS_BUBBLE_MAX_WIDTH,
  zIndex: 2,
});

export const getCoupleConnectorSx = () => ({
  flex: 1,
  position: 'relative' as const,
  alignSelf: 'center',
  minWidth: 72,
  height: 56,
  mx: 0.5,
});

export const getCoupleLockBadgeSx = (theme: Theme, interactive = false) => {
  const isLight = theme.palette.mode === 'light';
  // Непрозрачный фон: иначе сквозь бейдж видны концы пунктирных линий
  const bgcolor = isLight ? theme.palette.common.white : theme.palette.background.paper;
  const accentColor = getCoupleDistanceAccentColor(theme);

  return {
    position: 'absolute' as const,
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.5,
    minWidth: 56,
    minHeight: 28,
    px: 1.25,
    py: 0.5,
    borderRadius: 999,
    bgcolor,
    border: isLight ? 'none' : `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
    boxShadow: isLight
      ? `0 2px 10px ${alpha(theme.palette.common.black, 0.1)}`
      : `0 2px 12px ${alpha(theme.palette.common.black, 0.28)}`,
    color: accentColor,
    fontSize: '0.8125rem',
    fontWeight: 700,
    lineHeight: 1,
    zIndex: 3,
    ...(interactive && {
      cursor: 'pointer',
      fontFamily: 'inherit',
      border: isLight ? 'none' : `1px solid ${alpha(theme.palette.common.white, 0.14)}`,
      outline: 'none',
      transition: 'transform 150ms ease, box-shadow 150ms ease',
      '&:hover': {
        transform: 'translateX(-50%) translateY(-1px)',
        boxShadow: isLight
          ? `0 4px 14px ${alpha(theme.palette.common.black, 0.14)}`
          : `0 4px 16px ${alpha(theme.palette.common.black, 0.36)}`,
      },
      '&:active': {
        transform: 'translateX(-50%) translateY(0)',
      },
    }),
  };
};

const BUBBLE_TAIL_HALF_WIDTH = 7;
/** Отступ хвостика от края облака — чтобы не упирался в скругление */
const BUBBLE_TAIL_EDGE_INSET = 14;
/** Насколько хвостик заходит под тело облака */
const BUBBLE_TAIL_OVERLAP = 3;

export const getThoughtBubbleRootSx = (theme: Theme, editable: boolean) => {
  const hoverShadow =
    theme.palette.mode === 'light'
      ? `0 4px 14px ${alpha(theme.palette.common.black, 0.14)}`
      : `0 4px 16px ${alpha(theme.palette.common.black, 0.36)}`;

  return {
    position: 'relative' as const,
    display: 'inline-block',
    maxWidth: STATUS_BUBBLE_MAX_WIDTH,
    verticalAlign: 'top',
    overflow: 'visible' as const,
    p: 0,
    m: 0,
    border: 'none',
    background: 'none',
    appearance: 'none' as const,
    pointerEvents: editable ? ('auto' as const) : ('none' as const),
    cursor: editable ? 'pointer' : 'default',
    transition: 'transform 150ms ease',
    ...(editable && {
      '&:hover': {
        transform: 'translateY(-1px)',
        '& [data-thought-bubble-body]': {
          boxShadow: hoverShadow,
        },
      },
    }),
  };
};

export const getThoughtBubbleTailSx = (
  theme: Theme,
  tailAlign: 'left' | 'right' = 'left'
) => {
  const surface = getBubbleSurface(theme);

  return {
    position: 'absolute' as const,
    zIndex: 0,
    bottom: -(BUBBLE_TAIL_HALF_WIDTH - BUBBLE_TAIL_OVERLAP),
    width: 0,
    height: 0,
    borderLeft: `${BUBBLE_TAIL_HALF_WIDTH}px solid transparent`,
    borderRight: `${BUBBLE_TAIL_HALF_WIDTH}px solid transparent`,
    borderTop: `${BUBBLE_TAIL_HALF_WIDTH}px solid ${surface.bgcolor}`,
    pointerEvents: 'none' as const,
    ...(tailAlign === 'left'
      ? { left: BUBBLE_TAIL_EDGE_INSET }
      : { right: BUBBLE_TAIL_EDGE_INSET, left: 'auto' }),
  };
};

export const getThoughtBubbleBodySx = (theme: Theme) => {
  const surface = getBubbleSurface(theme);

  return {
    position: 'relative' as const,
    zIndex: 1,
    display: 'block',
    boxSizing: 'border-box' as const,
    maxWidth: STATUS_BUBBLE_MAX_WIDTH,
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
    transition: 'box-shadow 150ms ease',
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

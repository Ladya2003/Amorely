import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getChatDialogBackdropSx,
  getPageTopGlowBackground,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';
import { GAMES_LIST_ITEM_RADIUS, GAMES_LIST_THUMB_RADIUS } from './gamesListStyles';

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const GAME_PLAY_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

export const gamePlayEnterSx = {
  '@keyframes gamePlayEnter': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'gamePlayEnter 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const getGamePlayRootSx = (theme: Theme) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden' as const,
  ...getChatDialogBackdropSx(theme),
  ...gamePlayEnterSx,
});

export const getGamePlayLoadingWrapSx = (theme: Theme) => ({
  ...getGamePlayRootSx(theme),
  alignItems: 'center',
  justifyContent: 'center',
});

export const getGamePlayBlockedPanelSx = (theme: Theme) => ({
  ...getGamePlayRootSx(theme),
  alignItems: 'center',
  justifyContent: 'center',
  p: 3,
});

export const getGamePlayBlockedCardSx = (theme: Theme) => ({
  width: '100%',
  maxWidth: 420,
  p: 3,
  textAlign: 'center' as const,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.22 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
});

export const getGamePlayTimerBarSx = (theme: Theme) => ({
  flexShrink: 0,
  px: 2,
  pt: 1,
  pb: 1.25,
  borderBottom: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
});

export const getGamePlayTimerTextSx = (isTimeLow: boolean) => ({
  display: 'block',
  mb: 0.75,
  textAlign: 'center' as const,
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  textTransform: 'none' as const,
  color: isTimeLow ? 'error.main' : 'text.secondary',
});

export const getGamePlayTimerProgressSx = () => ({
  height: 8,
  borderRadius: 999,
  bgcolor: (theme: Theme) =>
    alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.22),
  '& .MuiLinearProgress-bar': {
    borderRadius: 999,
    transition: 'transform 1s linear',
  },
});

export const getGamePlayHeaderSx = (theme: Theme) => ({
  px: 1.25,
  py: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  flexShrink: 0,
  borderBottom: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.22 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
});

export const getGamePlayHeaderIconButtonSx = (theme: Theme) => ({
  flexShrink: 0,
  color: 'text.secondary',
  border: getSurfaceBorder(theme, 'soft'),
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
  '&:hover': {
    color: 'text.primary',
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
});

export const getGamePlayHeaderTitleSx = () => ({
  fontWeight: 700,
  fontSize: '0.9375rem',
  lineHeight: 1.3,
});

export const getGamePlayHeaderSubtitleSx = () => ({
  display: 'block',
  fontSize: '0.75rem',
  lineHeight: 1.2,
  letterSpacing: '-0.01em',
  textTransform: 'none' as const,
  color: 'text.secondary',
});

export const getGamePlayContentSx = () => ({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  p: 2,
});

export const getGamePlayFooterSx = (theme: Theme) => ({
  p: 2,
  pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
  flexShrink: 0,
  borderTop: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
});

export const getGamePlayCenterPanelSx = (theme: Theme) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  p: 3,
  maxWidth: 420,
  mx: 'auto',
  width: '100%',
  textAlign: 'center' as const,
});

export const getGamePlayCenterCardSx = (theme: Theme) => ({
  width: '100%',
  p: 3,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.22 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
});

export const getGamePlayReadyDotSx = (
  theme: Theme,
  options: { ready: boolean; clickable?: boolean }
) => ({
  width: 52,
  height: 52,
  borderRadius: '50%',
  bgcolor: options.ready
    ? 'success.main'
    : alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.18),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: options.ready ? 'success.contrastText' : 'text.secondary',
  fontWeight: 700,
  fontSize: '1.125rem',
  border: options.ready ? 'none' : getSurfaceBorder(theme, 'soft'),
  p: 0,
  cursor: options.clickable ? 'pointer' : 'default',
  boxShadow: options.ready
    ? `0 8px 20px ${alpha(theme.palette.success.main, 0.35)}`
    : 'none',
  transition: 'background-color 0.2s ease, transform 0.2s ease',
  '&:hover': options.clickable
    ? {
        transform: 'scale(1.04)',
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.26),
      }
    : undefined,
});

export const getGamePlayReadyLabelSx = () => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  textTransform: 'none' as const,
  color: 'text.secondary',
});

export const getGamePlayCountdownSx = () => ({
  fontWeight: 800,
  fontSize: '2.75rem',
  lineHeight: 1,
  letterSpacing: '-0.03em',
  color: 'primary.main',
});

export const getGamePlayPrimaryButtonSx = () => ({
  py: 1.125,
  fontWeight: 600,
  fontSize: '0.9375rem',
  boxShadow: 'none',
});

export const getGamePlayOutlinedButtonSx = (theme: Theme) => ({
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '0.8125rem',
  borderColor: alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? 0.28 : 0.38
  ),
  '&:hover': {
    borderColor: alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.42 : 0.52
    ),
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
  },
});

export const getGamePlayTurnBannerSx = (theme: Theme, isActive: boolean) => ({
  mb: 1.5,
  py: 1,
  px: 1.5,
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  textAlign: 'center' as const,
  fontSize: '0.875rem',
  fontWeight: 600,
  border: isActive ? 'none' : getSurfaceBorder(theme, 'soft'),
  bgcolor: isActive
    ? 'primary.main'
    : alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
  color: isActive ? 'primary.contrastText' : 'text.secondary',
});

export const getGamePlayBoardWrapSx = (theme: Theme) => ({
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  overflow: 'hidden',
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
  '& .MuiTableCell-root': {
    borderColor: alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.1 : 0.18
    ),
  },
});

export const getGamePlayQuizCellButtonSx = (theme: Theme, used: boolean) => ({
  minHeight: 44,
  fontWeight: 700,
  borderRadius: `${Math.round(GAME_PLAY_ACTION_RADIUS * 0.75)}px`,
  opacity: used ? 0.45 : 1,
  boxShadow: used ? 'none' : `0 4px 12px ${alpha(theme.palette.primary.main, 0.18)}`,
});

export const getGamePlayOverlaySx = (theme: Theme) => {
  const base = theme.palette.background.default;
  const glow = getPageTopGlowBackground(theme, base, 'soft');

  return {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1200,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
    bgcolor: base,
    outline: 'none',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      backgroundImage: glow,
      pointerEvents: 'none',
      zIndex: 0,
    },
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
  };
};

export const getGamePlayBoardHiddenSx = () => ({
  visibility: 'hidden' as const,
  pointerEvents: 'none' as const,
});

export const getGamePlayHintCardSx = (theme: Theme) => ({
  mb: 2,
  p: 1.5,
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
});

export const getGamePlayChipSx = (theme: Theme) => ({
  height: 24,
  fontWeight: 600,
  fontSize: '0.6875rem',
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
});

export const getGamePlayMapOverlayButtonSx = () => ({
  bgcolor: 'rgba(0, 0, 0, 0.45)',
  color: 'common.white',
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  '&:hover': {
    bgcolor: 'rgba(0, 0, 0, 0.6)',
  },
});

export const getGamePlayTapBlockSx = (theme: Theme, isMyTurn: boolean) => ({
  position: 'relative' as const,
  display: 'block',
  width: '100%',
  maxWidth: 320,
  aspectRatio: '1 / 1',
  flexShrink: 0,
  border: isMyTurn ? '3px solid' : getSurfaceBorder(theme, 'medium'),
  borderColor: isMyTurn ? 'primary.main' : undefined,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  p: 0,
  overflow: 'hidden',
  cursor: isMyTurn ? 'pointer' : 'not-allowed',
  opacity: isMyTurn ? 1 : 0.55,
  transition: 'transform 0.1s ease, box-shadow 0.2s ease, opacity 0.2s ease',
  boxShadow: isMyTurn
    ? `0 16px 40px ${alpha(theme.palette.primary.main, 0.4)}`
    : theme.palette.mode === 'light'
      ? `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`
      : `0 10px 28px ${alpha(theme.palette.common.black, 0.28)}`,
  animation: isMyTurn ? 'tapBlockPulse 1.6s ease-in-out infinite' : 'none',
  '@keyframes tapBlockPulse': {
    '0%, 100%': {
      boxShadow: `0 16px 40px ${alpha(theme.palette.primary.main, 0.32)}`,
    },
    '50%': {
      boxShadow: `0 20px 48px ${alpha(theme.palette.primary.main, 0.55)}`,
    },
  },
  '&:active': isMyTurn ? { transform: 'scale(0.94)' } : undefined,
});

export const getGamePlayRevealStackSx = (theme: Theme) => ({
  mt: 2,
  p: 2,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  textAlign: 'center' as const,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
});

export const getDailyResetBadgeSx = (theme: Theme) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  px: 1,
  py: 0.375,
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  cursor: 'pointer',
  font: 'inherit',
  color: 'inherit',
  transition: 'border-color 0.2s ease, background-color 0.2s ease',
  '&:hover': {
    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.32 : 0.42),
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
});

export const getDailyResetBadgeTextSx = () => ({
  fontWeight: 600,
  fontSize: '0.6875rem',
  letterSpacing: '-0.01em',
  textTransform: 'none' as const,
  color: 'text.secondary',
  fontVariantNumeric: 'tabular-nums',
});

export const getTapGameListBadgeSx = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'flex-end',
  gap: 0.25,
  px: 1,
  py: 0.5,
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.2 },
  }),
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  pointerEvents: 'none' as const,
});

export const getDrawGuessChatPanelSx = (theme: Theme) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 0.5,
  p: 1,
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
  overflowY: 'auto' as const,
});

export const getDrawGuessBubbleSx = (theme: Theme, isOwn: boolean) => ({
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  maxWidth: '100%',
  px: 1.125,
  py: 0.625,
  borderRadius: `${GAME_PLAY_ACTION_RADIUS}px`,
  bgcolor: isOwn ? 'primary.main' : alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
  color: isOwn ? 'primary.contrastText' : 'text.primary',
  border: isOwn ? 'none' : getSurfaceBorder(theme, 'soft'),
});

export const getTapShopItemSx = (theme: Theme) => ({
  display: 'flex',
  gap: 1.5,
  p: 1.5,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
});

export const getTapShopItemImageSx = (theme: Theme) => ({
  width: 72,
  height: 72,
  borderRadius: `${GAMES_LIST_THUMB_RADIUS}px`,
  objectFit: 'cover' as const,
  flexShrink: 0,
  border: getSurfaceBorder(theme, 'soft'),
});

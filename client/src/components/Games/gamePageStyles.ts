import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getChatDialogBackdropSx,
  getFeedHeaderGlowSx,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';
import { GAMES_LIST_ITEM_RADIUS } from './gamesListStyles';

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const gamePageEnterSx = {
  '@keyframes gamePageEnter': {
    from: {
      opacity: 0,
      transform: 'translateY(14px) scale(0.985)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0) scale(1)',
    },
  },
  animation: 'gamePageEnter 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const gamePageSectionEnterSx = (delayMs = 0) => ({
  '@keyframes gamePageSectionIn': {
    from: {
      opacity: 0,
      transform: 'translateY(10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  animation: `gamePageSectionIn 0.36s cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms both`,
});

export const gamePageTabContentEnterSx = {
  '@keyframes gamePageTabIn': {
    from: {
      opacity: 0,
      transform: 'translateY(8px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  animation: 'gamePageTabIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const gameLeaderboardRowEnterSx = (index: number) => ({
  '@keyframes gameLeaderboardRowIn': {
    from: {
      opacity: 0,
      transform: 'translateX(-8px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
  animation: `gameLeaderboardRowIn 0.34s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(index * 0.05, 0.35)}s both`,
});

export const getGamePageRootSx = (theme: Theme) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden' as const,
  ...getChatDialogBackdropSx(theme),
});

export const getGamePageHeaderGlowWrapSx = (theme: Theme) => ({
  ...getFeedHeaderGlowSx(theme),
  px: 0,
  flexShrink: 0,
  pt: {
    xs: `calc(${theme.spacing(3)} + env(safe-area-inset-top, 0px))`,
    sm: `calc(${theme.spacing(2.5)} + env(safe-area-inset-top, 0px))`,
  },
  pb: 0.5,
});

export const getGamePageHeaderSx = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minHeight: 52,
  px: 1.25,
  py: 0.75,
  mx: 2,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.22 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`
      : `0 10px 32px ${alpha(theme.palette.common.black, 0.24)}`,
});

export const getGamePageHeaderTitleSx = () => ({
  flex: 1,
  minWidth: 0,
  fontWeight: 700,
  fontSize: '1.0625rem',
  lineHeight: 1.3,
});

export const getGamePageHeaderIconButtonSx = (theme: Theme) => ({
  flexShrink: 0,
  color: 'text.secondary',
  border: getSurfaceBorder(theme, 'soft'),
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.5)}px`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
  transition: 'background-color 180ms ease, color 180ms ease',
  '&:hover': {
    color: 'text.primary',
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
});

export const getGamePageTabsWrapSx = () => ({
  flexShrink: 0,
  px: 2,
  pb: 1,
  pt: 0.25,
});

export const getGamePageScrollSx = () => ({
  flex: 1,
  overflow: 'auto',
  px: 2,
  py: 2,
});

export const getGamePageContentStackSx = () => ({
  maxWidth: 640,
  mx: 'auto',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 2,
});

export const getGamePageHeroImageSx = (theme: Theme) => ({
  width: '100%',
  maxHeight: 240,
  objectFit: 'cover' as const,
  display: 'block',
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 12px 36px ${alpha(theme.palette.common.black, 0.1)}`
      : `0 16px 44px ${alpha(theme.palette.common.black, 0.32)}`,
});

export const getGamePageDescriptionSx = () => ({
  fontSize: '0.9375rem',
  lineHeight: 1.55,
  color: 'text.secondary',
});

export const getGamePageRulesCardSx = (theme: Theme) => ({
  p: 2,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.09, dark: 0.16 },
  }),
  '& ul': {
    m: 0,
    pl: 2.25,
  },
  '& li': {
    mb: 0.75,
    '&:last-of-type': {
      mb: 0,
    },
  },
});

export const getGamePageRulesTitleSx = () => ({
  fontWeight: 700,
  fontSize: '0.875rem',
  letterSpacing: '-0.01em',
  color: 'text.secondary',
  mb: 1.25,
});

export const getGamePageFooterSx = (theme: Theme) => ({
  flexShrink: 0,
  px: 2,
  pt: 1.5,
  pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
  borderTop: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
});

export const getGamePageBlockedBannerSx = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 1,
  p: 1.5,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.11, dark: 0.2 },
  }),
});

export const getGamePageLoadingSx = (theme: Theme) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  py: 6,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
});

export const getGameLeaderboardSubtitleSx = () => ({
  mb: 1.5,
  fontSize: '0.875rem',
  lineHeight: 1.5,
});

export const getGameLeaderboardEmptySx = (theme: Theme) => ({
  py: 5,
  px: 3,
  textAlign: 'center' as const,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
});

export const getGameLeaderboardItemSx = (theme: Theme, rank: number) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  p: 1.5,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme, rank <= 3 ? 'medium' : 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: {
      light: rank <= 3 ? 0.14 : 0.1,
      dark: rank <= 3 ? 0.24 : 0.18,
    },
  }),
  ...(rank <= 3 && {
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.2)}`,
  }),
});

export const getGameLeaderboardRankSlotSx = () => ({
  width: 30,
  display: 'flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexShrink: 0,
});

export const getGameLeaderboardRankSx = (theme: Theme, rank: number) => ({
  fontWeight: 800,
  fontSize: rank <= 3 ? '1rem' : '0.9375rem',
  lineHeight: 1,
  textAlign: 'center' as const,
  color: rank <= 3 ? theme.palette.primary.main : theme.palette.text.secondary,
});

export const getAvatarRankMedalOverlaySx = () => ({
  position: 'absolute' as const,
  top: -6,
  left: -6,
  zIndex: 2,
  pointerEvents: 'none' as const,
});

export const getGameLeaderboardAvatarSx = (index: number) => ({
  width: 38,
  height: 38,
  ml: index === 0 ? 0 : -1.25,
  border: '2px solid',
  borderColor: 'background.paper',
  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
});

export const getGameLeaderboardScoreSx = () => ({
  fontWeight: 700,
  fontSize: '0.875rem',
  flexShrink: 0,
  color: 'text.secondary',
});

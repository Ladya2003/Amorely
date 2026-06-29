import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';

export const GAMES_LIST_ITEM_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const GAMES_LIST_THUMB_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const getGamesListRootSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  bgcolor: 'transparent',
});

export const getGamesListSearchWrapSx = () => ({
  px: 2,
  pb: 1.5,
  pt: 0.25,
  flexShrink: 0,
});

export const getGamesListScrollSx = () => ({
  px: 2,
  py: 2,
});

export const getGamesListStackSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1.25,
});

export const getGamesListItemSx = (theme: Theme, options?: { available?: boolean }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 1.5,
  width: '100%',
  p: 1.5,
  borderRadius: `${GAMES_LIST_ITEM_RADIUS}px`,
  border: getSurfaceBorder(theme, options?.available === false ? 'soft' : 'medium'),
  ...getPrimaryTintSurface(theme, {
    tint: {
      light: options?.available === false ? 0.07 : 0.11,
      dark: options?.available === false ? 0.12 : 0.2,
    },
    hover: {
      light: options?.available === false ? 0.1 : 0.16,
      dark: options?.available === false ? 0.16 : 0.26,
    },
    interactive: true,
  }),
  color: 'text.primary',
  textAlign: 'left' as const,
  transition:
    'background-color 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease, opacity 220ms ease',
  WebkitAppearance: 'none',
  opacity: options?.available === false ? 0.88 : 1,
  '&:hover': {
    transform: options?.available === false ? 'none' : 'translateY(-1px)',
    borderColor: alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.28 : 0.38
    ),
  },
});

export const getGamesListThumbSx = (theme: Theme) => ({
  width: 76,
  height: 76,
  flexShrink: 0,
  borderRadius: `${GAMES_LIST_THUMB_RADIUS}px`,
  overflow: 'hidden',
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.22 },
  }),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 6px 18px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 8px 22px ${alpha(theme.palette.common.black, 0.24)}`,
});

export const getGamesListTitleSx = () => ({
  fontWeight: 700,
  mb: 0.5,
  color: 'inherit',
  fontSize: '0.9375rem',
  lineHeight: 1.3,
});

export const getGamesListDescriptionSx = () => ({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
  lineHeight: 1.45,
  fontSize: '0.8125rem',
});

export const getGamesListEmptyStateSx = (theme: Theme) => ({
  height: '100%',
  minHeight: 240,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center' as const,
  px: 3,
  py: 4,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
});

export const getGamesListComingSoonChipSx = (theme: Theme) => ({
  position: 'absolute' as const,
  top: 12,
  right: 12,
  height: 26,
  fontWeight: 600,
  fontSize: '0.6875rem',
  borderRadius: `${GAMES_LIST_THUMB_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.14, dark: 0.24 },
  }),
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  '& .MuiChip-icon': {
    color: 'primary.main',
  },
});

export const getGamesListBadgeWrapSx = () => ({
  position: 'absolute' as const,
  top: 12,
  right: 12,
  zIndex: 1,
});

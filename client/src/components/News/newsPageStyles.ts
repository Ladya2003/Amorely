import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getChatDialogBackdropSx,
  getFeedHeaderGlowSx,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';
import { getTabPageBottomPaddingSx, getTabPageDesktopShellSx } from '../../theme/pageLayout';

export const NEWS_CARD_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const NEWS_CHIP_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);
export const NEWS_MEDIA_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const newsPageEnterSx = {
  '@keyframes newsPageEnter': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'newsPageEnter 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const getNewsCardEnterSx = (index: number) => ({
  '@keyframes newsCardEnter': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: `newsCardEnter 0.34s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(index * 0.05, 0.35)}s both`,
});

export const NEWS_DETAIL_TRANSITION_MS = {
  enter: 380,
  exit: 320,
} as const;

export const newsDetailEnterSx = {
  '@keyframes newsDetailEnter': {
    from: { transform: 'translateY(16px)' },
    to: { transform: 'translateY(0)' },
  },
  animation: `newsDetailEnter ${NEWS_DETAIL_TRANSITION_MS.enter}ms cubic-bezier(0.22, 1, 0.36, 1)`,
} as const;

export const newsListRevealSx = {
  '@keyframes newsListReveal': {
    from: {
      opacity: 0,
      transform: 'translateX(-14px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
  animation: `newsListReveal ${NEWS_DETAIL_TRANSITION_MS.exit}ms cubic-bezier(0.22, 1, 0.36, 1)`,
} as const;

export const getNewsPageRootSx = (theme: Theme) => ({
  ...getTabPageDesktopShellSx(),
  display: 'flex',
  flexDirection: 'column' as const,
  ...getTabPageBottomPaddingSx(),
  ...getChatDialogBackdropSx(theme),
});

export const getNewsPageHeaderGlowWrapSx = (theme: Theme) => ({
  ...getFeedHeaderGlowSx(theme),
  flexShrink: 0,
  pt: {
    xs: `calc(${theme.spacing(2)} + env(safe-area-inset-top, 0px))`,
    sm: theme.spacing(1.5),
  },
  pb: 0.5,
});

export const getNewsPageHeaderRowSx = () => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1.5,
  px: 2,
  pb: 1,
});

export const getNewsPageTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.375rem',
  lineHeight: 1.2,
  letterSpacing: '-0.02em',
});

export const getNewsCategoryRowSx = () => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 0.75,
  px: 2,
  pb: 1.25,
  flexShrink: 0,
});

export const getNewsCategoryChipSx = (theme: Theme, selected?: boolean) =>
  selected
    ? {}
    : {
        borderRadius: `${NEWS_CHIP_RADIUS}px`,
        border: getSurfaceBorder(theme, 'soft'),
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.14),
        fontWeight: 600,
        fontSize: '0.8125rem',
      };

export const getNewsListScrollSx = () => ({
  px: 2,
  py: 1,
});

export const getNewsListStackSx = () => ({
  maxWidth: 720,
  mx: 'auto',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1.25,
});

export const getNewsCardSx = (theme: Theme) => ({
  position: 'relative' as const,
  width: '100%',
  textAlign: 'left' as const,
  border: getSurfaceBorder(theme),
  borderRadius: `${NEWS_CARD_RADIUS}px`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.11, dark: 0.2 },
    hover: { light: 0.16, dark: 0.26 },
    interactive: true,
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  color: 'text.primary',
  cursor: 'pointer',
  transition:
    'background-color 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease',
  WebkitAppearance: 'none',
  '&:hover': {
    transform: 'translateY(-1px)',
    borderColor: alpha(
      theme.palette.primary.main,
      theme.palette.mode === 'light' ? 0.28 : 0.38
    ),
  },
});

export const getNewsCardContentSx = (hasBadge?: boolean) => ({
  p: 2,
  ...(hasBadge ? { pt: 2.5, pr: 7 } : {}),
});

export const getNewsNewBadgeSx = () => ({
  position: 'absolute' as const,
  top: 12,
  right: 12,
  zIndex: 1,
  height: 22,
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  pointerEvents: 'none' as const,
});

export const getNewsCardTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1rem',
  lineHeight: 1.35,
  mb: 1,
});

export const getNewsCardMetaSx = () => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'center',
  gap: 0.75,
  mb: 1.25,
});

export const getNewsCardDateSx = () => ({
  fontSize: '0.8125rem',
  color: 'text.secondary',
});

export const getNewsCardExcerptSx = () => ({
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
  whiteSpace: 'pre-line' as const,
  fontSize: '0.875rem',
  lineHeight: 1.5,
  color: 'text.secondary',
  mb: 1,
});

export const getNewsCardReadMoreSx = () => ({
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'primary.main',
});

export const getNewsEmptySx = (theme: Theme) => ({
  maxWidth: 720,
  mx: 'auto',
  p: 4,
  textAlign: 'center' as const,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, { tint: { light: 0.08, dark: 0.14 } }),
});

export const getNewsLoadingWrapSx = () => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flex: 1,
  minHeight: 240,
});

export const getNewsDetailRootSx = (theme: Theme) => {
  const { primary } = theme.palette;
  const isLight = theme.palette.mode === 'light';
  const base = theme.palette.background.default;
  const glow = isLight
    ? `radial-gradient(120% 72% at 50% -6%, ${alpha(primary.light, 0.58)} 0%, ${alpha(primary.main, 0.16)} 44%, ${base} 74%)`
    : `radial-gradient(120% 72% at 50% -6%, ${alpha(primary.main, 0.38)} 0%, ${alpha(primary.dark, 0.24)} 42%, ${base} 74%)`;

  return {
    position: 'absolute' as const,
    inset: 0,
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
  };
};

export const getNewsDetailHeaderWrapSx = () => ({
  flexShrink: 0,
  px: 2,
  pt: `calc(${12}px + env(safe-area-inset-top, 0px))`,
  pb: 1,
});

export const getNewsDetailHeaderSx = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minHeight: 52,
  px: 1.25,
  py: 0.75,
  borderRadius: `${NEWS_CARD_RADIUS}px`,
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

export const getNewsDetailHeaderTitleSx = () => ({
  flex: 1,
  minWidth: 0,
  fontWeight: 700,
  fontSize: '1rem',
  lineHeight: 1.3,
});

export const getNewsDetailHeaderIconButtonSx = (theme: Theme) => ({
  flexShrink: 0,
  color: 'text.secondary',
  border: getSurfaceBorder(theme, 'soft'),
  borderRadius: `${NEWS_CHIP_RADIUS}px`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
  transition: 'background-color 180ms ease, color 180ms ease',
  '&:hover': {
    color: 'text.primary',
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
});

export const getNewsDetailScrollSx = () => ({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  px: 2,
  py: 2,
  pb: 'max(24px, env(safe-area-inset-bottom, 0px))',
});

export const getNewsDetailContentStackSx = () => ({
  maxWidth: 720,
  mx: 'auto',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 2,
});

export const getNewsDetailTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.375rem',
  lineHeight: 1.25,
  letterSpacing: '-0.02em',
});

export const getNewsDetailMetaSx = () => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'center',
  gap: 0.75,
});

export const getNewsDetailBodySx = () => ({
  whiteSpace: 'pre-line' as const,
  fontSize: '0.9375rem',
  lineHeight: 1.6,
  color: 'text.primary',
});

export const getNewsDetailMediaCaptionSx = () => ({
  fontWeight: 700,
  fontSize: '0.875rem',
  mb: 1,
});

export const getNewsDetailMediaSx = (theme: Theme) => ({
  width: '100%',
  maxHeight: 480,
  display: 'block',
  borderRadius: `${NEWS_MEDIA_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 10px 28px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 12px 36px ${alpha(theme.palette.common.black, 0.28)}`,
});

export const getNewsDetailImageSx = (theme: Theme) => ({
  ...getNewsDetailMediaSx(theme),
  objectFit: 'contain' as const,
});

export const getNewsDetailVideoSx = (theme: Theme) => ({
  ...getNewsDetailMediaSx(theme),
  bgcolor: 'black',
});

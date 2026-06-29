import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';
import { MODAL_INNER_RADIUS, MODAL_ACTION_RADIUS } from '../../theme/modalStyles';

export const CALENDAR_DRAWER_INNER_RADIUS = MODAL_INNER_RADIUS;
export const CALENDAR_DRAWER_ACTION_RADIUS = MODAL_ACTION_RADIUS;

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const getCalendarDrawerPaperSx = (theme: Theme, isMobile: boolean) => ({
  width: isMobile ? '100%' : 500,
  maxWidth: '100vw',
  display: 'flex',
  flexDirection: 'column',
  borderLeft: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.07, dark: 0.14 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  backgroundImage: 'none',
  boxShadow:
    theme.palette.mode === 'light'
      ? `-12px 0 40px ${alpha(theme.palette.common.black, 0.08)}`
      : `-16px 0 48px ${alpha(theme.palette.common.black, 0.32)}`,
});

export const getCalendarDrawerHeaderWrapSx = () => ({
  flexShrink: 0,
  px: 2,
  pt: `calc(${12}px + env(safe-area-inset-top, 0px))`,
  pb: 1,
});

export const getCalendarDrawerHeaderSx = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minHeight: 52,
  px: 1.25,
  py: 0.75,
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
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

export const getCalendarDrawerHeaderTitleSx = () => ({
  flex: 1,
  minWidth: 0,
  fontWeight: 700,
  fontSize: '1.0625rem',
  lineHeight: 1.3,
});

export const getCalendarDrawerHeaderIconButtonSx = (theme: Theme) => ({
  flexShrink: 0,
  color: 'text.secondary',
  border: getSurfaceBorder(theme, 'soft'),
  borderRadius: `${CALENDAR_DRAWER_ACTION_RADIUS}px`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
  transition: 'background-color 180ms ease, color 180ms ease',
  '&:hover': {
    color: 'text.primary',
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
});

export const getCalendarDrawerContentSx = () => ({
  flexGrow: 1,
  overflow: 'auto',
  px: 2.5,
  py: 2,
  pb: 3,
});

export const getCalendarDrawerFooterSx = (theme: Theme) => ({
  flexShrink: 0,
  borderTop: getSurfaceBorder(theme, 'soft'),
  px: 2.5,
  py: 2,
  pt: 1.5,
  pb: `calc(${16}px + env(safe-area-inset-bottom, 0px))`,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
});

export const getEventEditorFlagBoxSx = (theme: Theme) => ({
  mb: 3,
  p: 2,
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
});

export const getEventEditorUploadCardSx = (theme: Theme) => ({
  p: 2,
  mb: 2,
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.14 },
  }),
});

export const getEventMediaPreviewSx = (theme: Theme) => ({
  position: 'relative' as const,
  width: 120,
  height: 120,
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
  overflow: 'hidden',
  border: getSurfaceBorder(theme),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 6px 18px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 8px 22px ${alpha(theme.palette.common.black, 0.28)}`,
});

export const getEventMediaDeleteButtonSx = (theme: Theme) => ({
  position: 'absolute',
  top: 6,
  right: 6,
  width: 28,
  height: 28,
  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.92 : 0.78),
  border: getSurfaceBorder(theme, 'soft'),
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: 'text.secondary',
  '&:hover': {
    bgcolor: alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.14 : 0.22),
    color: 'error.main',
    borderColor: alpha(theme.palette.error.main, 0.45),
  },
});

export const getEventMediaNavButtonSx = (theme: Theme) => ({
  position: 'absolute' as const,
  top: '50%',
  transform: 'translateY(-50%)',
  width: 28,
  height: 28,
  minWidth: 28,
  minHeight: 28,
  p: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: alpha(theme.palette.common.black, 0.52),
  border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
  color: 'common.white',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  '&:hover': {
    bgcolor: alpha(theme.palette.common.black, 0.72),
  },
  '& .MuiSvgIcon-root': {
    fontSize: 18,
  },
});

export const getContentManagementInfoBoxSx = (theme: Theme) => ({
  mx: { xs: 2, sm: 2.5 },
  mt: 2,
  mb: 1,
  p: 2,
  borderRadius: `${CALENDAR_DRAWER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
});

export const getContentManagementTabsSx = (theme: Theme) => ({
  borderBottom: getSurfaceBorder(theme, 'soft'),
  px: { xs: 2, sm: 2.5 },
  minHeight: 48,
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
    minHeight: 48,
  },
  '& .MuiChip-root': {
    height: 22,
    fontWeight: 600,
    borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  },
});

import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getChatDialogBackdropSx,
  getFeedHeaderGlowSx,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';
import { getTabPageBottomPaddingSx, getTabPageDesktopShellSx } from '../../theme/pageLayout';

export const SETTINGS_NAV_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const SETTINGS_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);
export const SETTINGS_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const settingsPageEnterSx = {
  '@keyframes settingsPageEnter': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'settingsPageEnter 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const getSettingsTabPanelEnterSx = (direction: number) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  animation: 'settingsTabPanelEnter 340ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes settingsTabPanelEnter': {
    from: {
      opacity: 0,
      transform:
        direction > 0
          ? 'translateX(16px)'
          : direction < 0
            ? 'translateX(-16px)'
            : 'translateY(8px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0) translateY(0)',
    },
  },
});

export const getSettingsPageRootSx = (theme: Theme) => ({
  ...getTabPageDesktopShellSx(),
  display: 'flex',
  flexDirection: 'column' as const,
  ...getTabPageBottomPaddingSx(),
  ...getChatDialogBackdropSx(theme),
});

export const getSettingsPageHeaderGlowWrapSx = (theme: Theme) => ({
  ...getFeedHeaderGlowSx(theme),
  flexShrink: 0,
  pt: {
    xs: `calc(${theme.spacing(2)} + env(safe-area-inset-top, 0px))`,
    sm: theme.spacing(1.5),
  },
  pb: 0.5,
});

export const getSettingsPageHeaderRowSx = () => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1.5,
  px: 2,
  pb: 1,
});

export const getSettingsPageTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.375rem',
  lineHeight: 1.2,
  letterSpacing: '-0.02em',
});

export const getSettingsBodySx = (isMobile: boolean) => ({
  display: 'flex',
  flexDirection: isMobile ? ('column' as const) : ('row' as const),
  gap: isMobile ? 1.25 : 1.5,
  px: 2,
});

export const getSettingsNavWrapSx = (isMobile: boolean) => ({
  flexShrink: 0,
  width: isMobile ? '100%' : 220,
  ...(isMobile
    ? {
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }
    : {}),
});

export const getSettingsNavPanelSx = (theme: Theme, isMobile: boolean) => ({
  display: 'flex',
  flexDirection: isMobile ? ('row' as const) : ('column' as const),
  gap: 0.75,
  p: isMobile ? 0.5 : 1,
  borderRadius: `${SETTINGS_NAV_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.18 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  ...(isMobile ? { width: 'max-content', minWidth: '100%' } : {}),
});

export const getSettingsNavTabSx = (theme: Theme, options: { selected?: boolean; isMobile?: boolean }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: options.isMobile ? 'center' : 'flex-start',
  gap: 1,
  width: options.isMobile ? 'auto' : '100%',
  ...(options.isMobile ? { minWidth: 'max-content', flexShrink: 0 } : {}),
  px: options.isMobile ? 1.5 : 1.25,
  py: options.isMobile ? 0.875 : 1,
  border: 'none',
  borderRadius: `${SETTINGS_INNER_RADIUS}px`,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.8125rem',
  fontWeight: options.selected ? 700 : 600,
  color: options.selected ? 'primary.contrastText' : 'text.primary',
  bgcolor: options.selected
    ? 'primary.main'
    : alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.12),
  transition: 'background-color 0.22s ease, color 0.22s ease, transform 0.2s ease',
  WebkitAppearance: 'none',
  '&:hover': {
    bgcolor: options.selected
      ? 'primary.dark'
      : alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.22),
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.125rem',
    flexShrink: 0,
  },
});

export const getSettingsContentPanelSx = (theme: Theme) => ({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column' as const,
  borderRadius: `${SETTINGS_NAV_RADIUS}px`,
  border: getSurfaceBorder(theme),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.11, dark: 0.2 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
});

export const getSettingsContentScrollSx = () => ({
  p: { xs: 2, sm: 2.5 },
});

export const getSettingsSectionTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.0625rem',
  lineHeight: 1.3,
  mb: 0.5,
});

export const getSettingsSectionSavingSx = () => ({
  ml: 1.5,
  fontSize: '0.8125rem',
  color: 'text.secondary',
});

export const getSettingsSectionDividerSx = (theme: Theme) => ({
  height: '1px',
  border: 'none',
  bgcolor: alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? 0.12 : 0.22
  ),
  my: 2.5,
});

export const getSettingsSubsectionTitleSx = () => ({
  fontWeight: 700,
  fontSize: '0.875rem',
  color: 'text.secondary',
  letterSpacing: '0.02em',
  mb: 1,
});

export const getSettingsHintSx = () => ({
  mt: 1,
  fontSize: '0.8125rem',
  color: 'text.secondary',
  lineHeight: 1.45,
});

export const getSettingsPartnerCardSx = (theme: Theme) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  p: 1.5,
  mb: 2,
  borderRadius: `${SETTINGS_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, { tint: { light: 0.08, dark: 0.14 } }),
});

export const getSettingsListItemSx = (theme: Theme) => ({
  flexDirection: { xs: 'column', sm: 'row' } as const,
  alignItems: { xs: 'stretch', sm: 'center' } as const,
  gap: 1.5,
  py: 1.5,
  px: 1.5,
  mb: 1,
  borderRadius: `${SETTINGS_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, { tint: { light: 0.07, dark: 0.12 } }),
});

export const getSettingsEmptyStateSx = (theme: Theme) => ({
  textAlign: 'center' as const,
  py: 3,
  px: 2,
  borderRadius: `${SETTINGS_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, { tint: { light: 0.06, dark: 0.1 } }),
});

export const getSettingsAvatarWrapSx = (theme: Theme) => ({
  position: 'relative' as const,
  mb: 1.5,
  '& .MuiAvatar-root': {
    width: 120,
    height: 120,
    border: getSurfaceBorder(theme, 'medium'),
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 8px 24px ${alpha(theme.palette.common.black, 0.08)}`
        : `0 10px 28px ${alpha(theme.palette.common.black, 0.28)}`,
  },
});

export const getSettingsAvatarButtonSx = (theme: Theme) => ({
  position: 'absolute' as const,
  bottom: 0,
  right: 0,
  border: getSurfaceBorder(theme, 'soft'),
  borderRadius: `${SETTINGS_ACTION_RADIUS}px`,
  ...getPrimaryTintSurface(theme, { tint: { light: 0.12, dark: 0.22 } }),
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
});

export const getSettingsPrimaryColorSwatchSx = (theme: Theme, selected: boolean) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  cursor: 'pointer',
  border: selected ? `3px solid ${theme.palette.text.primary}` : getSurfaceBorder(theme, 'soft'),
  boxShadow: selected
    ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.35)}`
    : theme.palette.mode === 'light'
      ? `0 4px 12px ${alpha(theme.palette.common.black, 0.1)}`
      : `0 6px 16px ${alpha(theme.palette.common.black, 0.28)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  outline: 'none',
  '&:hover': {
    transform: 'scale(1.06)',
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
});

export const getSettingsLogoutButtonSx = (theme: Theme) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '0.8125rem',
  minHeight: 38,
  px: 1.75,
  borderRadius: `${SETTINGS_ACTION_RADIUS}px`,
  border: `1px solid ${alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.35 : 0.45)}`,
  bgcolor: alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.08 : 0.14),
  color: 'error.main',
  '&:hover': {
    bgcolor: alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.14 : 0.22),
    borderColor: alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.5 : 0.6),
  },
  '& .MuiButton-startIcon': {
    margin: 0,
    marginRight: 0.75,
    display: 'inline-flex',
    alignItems: 'center',
  },
});

export const getSettingsLoadingWrapSx = () => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  minHeight: 240,
});

export const getSettingsToggleGroupSx = {
  p: 0.5,
  borderRadius: '20px',
  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.14),
  flexWrap: 'wrap' as const,
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '16px !important',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.8125rem',
    color: 'text.primary',
    transition: 'background-color 0.25s ease, color 0.25s ease',
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      '&:hover': {
        bgcolor: 'primary.dark',
      },
    },
    '&:hover': {
      bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.24),
    },
  },
  '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
    borderLeft: 'none',
    marginLeft: 0,
  },
} as const;

export const getSettingsListSubheaderSx = () => ({
  bgcolor: 'transparent',
  px: 0,
  py: 0,
  lineHeight: 1.4,
  mb: 1,
});

export const getSettingsNotificationListSx = () => ({
  p: 0,
  '& .MuiListItem-root': {
    px: 1.5,
    py: 1.25,
    mb: 0.75,
    borderRadius: `${SETTINGS_INNER_RADIUS}px`,
    bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.1),
  },
});

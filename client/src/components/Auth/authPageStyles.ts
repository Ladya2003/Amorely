import { alpha, Theme } from '@mui/material/styles';
import {
  SURFACE_BORDER_RADIUS,
  getChatDialogBackdropSx,
  getPrimaryTintSurface,
} from '../Feed/feedBannerStyles';

export const AUTH_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);
export const AUTH_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const authPageEnterSx = {
  '@keyframes authPageEnter': {
    from: { opacity: 0, transform: 'translateY(12px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  animation: 'authPageEnter 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const getAuthPageRootSx = (theme: Theme) => ({
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  ...getChatDialogBackdropSx(theme),
});

export const getAuthPageContainerSx = () => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  py: { xs: 4, sm: 6 },
  px: 2,
  ...authPageEnterSx,
});

export const getAuthPageTopBarSx = () => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-end',
  mb: 2,
});

export const getAuthPageLogoRowSx = () => ({
  mb: 3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
});

export const getAuthPageLogoIconSx = (theme: Theme) => ({
  color: 'primary.main',
  fontSize: 40,
  filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.35)})`,
});

export const getAuthPageLogoTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.75rem',
  letterSpacing: '-0.03em',
  lineHeight: 1.1,
});

export const getAuthPageCardSx = (theme: Theme) => ({
  p: { xs: 3, sm: 4 },
  width: '100%',
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 16px 48px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 20px 56px ${alpha(theme.palette.common.black, 0.34)}`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.22 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
});

export const getAuthFormTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.25rem',
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
  mb: 2.5,
});

export const getAuthAlertSx = (theme: Theme) => ({
  mb: 2,
  borderRadius: `${AUTH_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  '& .MuiAlert-message': {
    fontSize: '0.875rem',
    lineHeight: 1.45,
  },
});

export const getAuthPrimaryButtonSx = () => ({
  mt: 3,
  mb: 2,
  py: 1.125,
  fontWeight: 600,
  fontSize: '0.9375rem',
  boxShadow: 'none',
});

export const getAuthLinkButtonSx = () => ({
  p: 0,
  minWidth: 'auto',
  fontWeight: 600,
  textTransform: 'none' as const,
  verticalAlign: 'baseline',
});

export const getAuthSwitchTextSx = () => ({
  textAlign: 'center' as const,
  fontSize: '0.875rem',
  color: 'text.secondary',
  lineHeight: 1.5,
});

export const getAuthTaglineSx = () => ({
  mt: 3,
  textAlign: 'center' as const,
  fontSize: '0.8125rem',
  color: 'text.secondary',
  lineHeight: 1.45,
  maxWidth: 280,
  mx: 'auto',
});

export const getAuthToggleGroupSx = {
  p: 0.5,
  borderRadius: '20px',
  bgcolor: (theme: Theme) => alpha(theme.palette.primary.main, 0.14),
  '& .MuiToggleButton-root': {
    border: 'none',
    borderRadius: '16px !important',
    flex: 1,
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

export const getAuthBackButtonSx = (theme: Theme) => ({
  alignSelf: 'flex-start',
  ml: -0.5,
  px: 1.25,
  py: 0.625,
  borderRadius: `${AUTH_ACTION_RADIUS}px`,
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: 'text.primary',
  border: getSurfaceBorder(theme, 'soft'),
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
  },
  '& .MuiButton-startIcon': {
    margin: 0,
    marginRight: 0.75,
  },
});

export const getAuthOutlinedButtonSx = (theme: Theme) => ({
  borderRadius: `${AUTH_ACTION_RADIUS}px`,
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

export const getAuthCryptoDescriptionSx = () => ({
  mb: 2.5,
  whiteSpace: 'pre-line' as const,
  fontSize: '0.875rem',
  color: 'text.secondary',
  lineHeight: 1.55,
});

export const getAuthCryptoTitleSx = () => ({
  fontWeight: 700,
  fontSize: '1.375rem',
  letterSpacing: '-0.02em',
  mb: 1.25,
});

export const getAuthCryptoActionRowSx = () => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 1,
  mb: 2,
});

export const getAuthCryptoPanelEnterSx = (tab: number) => ({
  animation: 'authCryptoPanelEnter 320ms cubic-bezier(0.22, 1, 0.36, 1)',
  '@keyframes authCryptoPanelEnter': {
    from: {
      opacity: 0,
      transform: tab === 0 ? 'translateX(-10px)' : 'translateX(10px)',
    },
    to: {
      opacity: 1,
      transform: 'translateX(0)',
    },
  },
});

import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../../theme/surfaceStyles';

export const ADMIN_REQUEST_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);

const ADMIN_REQUEST_MOBILE_BOTTOM_OFFSET =
  'calc(156px + max(16px, env(safe-area-inset-bottom, 0px)))';

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const getAdminRequestSectionSx = (theme: Theme) => ({
  px: 2.75,
  py: 2.25,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  width: '100%',
  cursor: 'pointer',
  border: getSurfaceBorder(theme),
  transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  ...getPrimaryTintSurface(theme, { interactive: true }),
  '&:hover': {
    transform: 'translateY(-2px)',
  },
});

export const getAdminRequestPageRootSx = (theme: Theme) => ({
  py: 2,
  pb: {
    xs: ADMIN_REQUEST_MOBILE_BOTTOM_OFFSET,
    sm: 4,
  },
  minHeight: '70vh',
  background: {
    xs: `radial-gradient(120% 80% at 50% -10%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.28)} 0%, transparent 55%)`,
    sm: 'transparent',
  },
});

export const getAdminRequestCardSx = (theme: Theme) => ({
  p: { xs: 2.5, sm: 3 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 10px 32px ${alpha(theme.palette.common.black, 0.06)}`
      : `0 12px 40px ${alpha(theme.palette.common.black, 0.34)}`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.2 },
  }),
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
});

export const getAdminRequestExampleCardSx = (theme: Theme, variant: 'real' | 'fake') => ({
  flex: 1,
  minWidth: 0,
  p: 1.5,
  borderRadius: `${ADMIN_REQUEST_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  textAlign: 'center' as const,
  bgcolor:
    variant === 'real'
      ? alpha(theme.palette.success.main, theme.palette.mode === 'light' ? 0.08 : 0.14)
      : alpha(theme.palette.error.main, theme.palette.mode === 'light' ? 0.08 : 0.14),
});

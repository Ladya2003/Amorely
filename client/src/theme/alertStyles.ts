import { AlertColor, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS } from './surfaceStyles';

type SeverityPaletteKey = 'success' | 'error' | 'warning' | 'info';

const resolveSeverityPalette = (theme: Theme, severity: AlertColor) => {
  const key: SeverityPaletteKey =
    severity === 'success' || severity === 'error' || severity === 'warning' || severity === 'info'
      ? severity
      : 'info';

  return theme.palette[key];
};

/** Glass / tint alert surface used site-wide for error, warning, success, info. */
export const getAppAlertStyles = (theme: Theme, severity: AlertColor = 'info') => {
  const palette = resolveSeverityPalette(theme, severity);
  const isLight = theme.palette.mode === 'light';
  const textColor = isLight ? palette.dark : theme.palette.common.white;

  return {
    width: '100%',
    position: 'relative' as const,
    overflow: 'hidden',
    borderRadius: `${SURFACE_BORDER_RADIUS}px`,
    px: 2,
    py: 1.25,
    alignItems: 'center',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: 1.45,
    color: textColor,
    bgcolor: alpha(palette.main, isLight ? 0.14 : 0.32),
    border: `1px solid ${alpha(palette.main, isLight ? 0.26 : 0.48)}`,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: isLight
      ? `0 10px 32px ${alpha(theme.palette.common.black, 0.12)}`
      : `0 12px 36px ${alpha(theme.palette.common.black, 0.5)}`,
    '& .MuiAlert-icon': {
      color: textColor,
      opacity: isLight ? 0.92 : 1,
      mr: 1.25,
    },
    '& .MuiAlert-message': {
      padding: '2px 0',
      fontSize: '0.875rem',
      lineHeight: 1.45,
      color: textColor,
    },
    '& .MuiAlert-action': {
      alignItems: 'center',
      pt: 0,
      mr: -0.5,
      '& .MuiIconButton-root': {
        color: isLight ? alpha(palette.dark, 0.72) : alpha(theme.palette.common.white, 0.88),
        '&:hover': {
          bgcolor: alpha(isLight ? palette.main : theme.palette.common.white, 0.12),
        },
      },
    },
  };
};

export const getAppAlertSx =
  (severity: AlertColor = 'info') =>
  (theme: Theme) =>
    getAppAlertStyles(theme, severity);

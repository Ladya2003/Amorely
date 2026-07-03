import React, { useEffect, useState } from 'react';
import { Alert, AlertColor, Box, Fade, Portal, SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS } from '../../theme/appTheme';

type SeverityPaletteKey = 'success' | 'error' | 'warning' | 'info';

const TOAST_PROGRESS_HEIGHT = 3;

const resolveSeverityPalette = (theme: Theme, severity: AlertColor) => {
  const key: SeverityPaletteKey =
    severity === 'success' || severity === 'error' || severity === 'warning' || severity === 'info'
      ? severity
      : 'info';

  return theme.palette[key];
};

export const getToastAlertSx =
  (severity: AlertColor): SxProps<Theme> =>
  (theme) => {
    const palette = resolveSeverityPalette(theme, severity);
    const isLight = theme.palette.mode === 'light';
    const textColor = isLight ? palette.dark : theme.palette.common.white;

    return {
      width: '100%',
      position: 'relative',
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
      boxShadow:
        theme.palette.mode === 'light'
          ? `0 10px 32px ${alpha(theme.palette.common.black, 0.12)}`
          : `0 12px 36px ${alpha(theme.palette.common.black, 0.5)}`,
      '& .MuiAlert-icon': {
        color: textColor,
        opacity: isLight ? 0.92 : 1,
        mr: 1.25,
      },
      '& .MuiAlert-message': {
        padding: '2px 0',
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

const ToastCountdownBar: React.FC<{
  duration: number;
  severity: AlertColor;
  runKey: number;
}> = ({ duration, severity, runKey }) => (
  <Box
    aria-hidden
    sx={(theme) => {
      const palette = resolveSeverityPalette(theme, severity);
      const isLight = theme.palette.mode === 'light';
      const barColor = isLight ? palette.main : theme.palette.common.white;

      return {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: TOAST_PROGRESS_HEIGHT,
        bgcolor: alpha(barColor, isLight ? 0.12 : 0.18),
        pointerEvents: 'none',
        '& > span': {
          display: 'block',
          height: '100%',
          width: '100%',
          transformOrigin: 'left center',
          bgcolor: alpha(barColor, isLight ? 0.72 : 0.92),
          animation: `toastProgressShrink ${duration}ms linear forwards`,
          '@keyframes toastProgressShrink': {
            from: { transform: 'scaleX(1)' },
            to: { transform: 'scaleX(0)' },
          },
        },
      };
    }}
  >
    <span key={runKey} />
  </Box>
);

/** @deprecated используйте getToastAlertSx(severity) */
export const toastAlertSx: SxProps<Theme> = getToastAlertSx('info');

/** Same green as filled success Alert background (`variant="filled"`). */
export const getToastSuccessBgColor = (theme: Theme): string => theme.palette.success.main;

/** Slightly more vivid green for online presence text. */
export const getOnlinePresenceColor = (theme: Theme): string =>
  theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark;

interface CustomSnackbarProps {
  open: boolean;
  message: string | null;
  severity: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
}

const getToastShellSx = (): SxProps<Theme> => ({
  position: 'fixed',
  top: {
    xs: 'calc(12px + env(safe-area-inset-top, 0px))',
    sm: 'calc(20px + env(safe-area-inset-top, 0px))',
  },
  left: { xs: 16, sm: 24 },
  right: { xs: 16, sm: 24 },
  maxWidth: 480,
  mx: 'auto',
  zIndex: (theme) => theme.zIndex.snackbar + 20,
});

const CustomSnackbar: React.FC<CustomSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 3000,
}) => {
  const [progressRunKey, setProgressRunKey] = useState(0);
  const showProgress = autoHideDuration > 0;

  useEffect(() => {
    if (open && showProgress) {
      setProgressRunKey((key) => key + 1);
    }
  }, [open, message, autoHideDuration, showProgress]);

  useEffect(() => {
    if (!open || !showProgress) {
      return undefined;
    }

    const timerId = window.setTimeout(onClose, autoHideDuration);
    return () => window.clearTimeout(timerId);
  }, [open, showProgress, autoHideDuration, onClose, message, progressRunKey]);

  if (!message) {
    return null;
  }

  return (
    <Portal>
      <Fade in={open} unmountOnExit>
        <Box sx={getToastShellSx()}>
          <Alert
            onClose={onClose}
            severity={severity}
            variant="standard"
            sx={getToastAlertSx(severity)}
          >
            {message}
            {showProgress && (
              <ToastCountdownBar
                duration={autoHideDuration}
                severity={severity}
                runKey={progressRunKey}
              />
            )}
          </Alert>
        </Box>
      </Fade>
    </Portal>
  );
};

export default CustomSnackbar;

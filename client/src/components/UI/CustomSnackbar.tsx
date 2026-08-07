import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertColor, Box, Fade, Portal, SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getAppAlertSx } from '../../theme/alertStyles';

const TOAST_PROGRESS_HEIGHT = 3;

/** @deprecated prefer getAppAlertSx — same glass alert surface */
export const getToastAlertSx = getAppAlertSx;

const ToastCountdownBar: React.FC<{
  duration: number;
  severity: AlertColor;
  runKey: number;
}> = ({ duration, severity, runKey }) => (
  <Box
    aria-hidden
    sx={(theme) => {
      const paletteKey =
        severity === 'success' || severity === 'error' || severity === 'warning' || severity === 'info'
          ? severity
          : 'info';
      const palette = theme.palette[paletteKey];
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
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open && showProgress) {
      setProgressRunKey((key) => key + 1);
    }
  }, [open, message, autoHideDuration, showProgress]);

  useEffect(() => {
    if (!open || !showProgress) {
      return undefined;
    }

    // onClose через ref — иначе инлайн-колбэк родителя сбрасывает таймер на каждом ре-рендере
    const timerId = window.setTimeout(() => {
      onCloseRef.current();
    }, autoHideDuration);
    return () => window.clearTimeout(timerId);
  }, [open, showProgress, autoHideDuration, message, progressRunKey]);

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

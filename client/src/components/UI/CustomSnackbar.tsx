import React from 'react';
import { Snackbar, Alert, AlertColor, SxProps, Theme } from '@mui/material';

export const toastAlertSx: SxProps<Theme> = {
  width: '100%',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
};

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

const CustomSnackbar: React.FC<CustomSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 3000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={toastAlertSx}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;

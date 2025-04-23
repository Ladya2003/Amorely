import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

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
  autoHideDuration = 2000,
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
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar; 
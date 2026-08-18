import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';
import ResponsiveDialog from '../UI/ResponsiveDialog';
import { useMemoryRestore } from '../../contexts/MemoryRestoreContext';

interface MemoryRestoreRequestDialogProps {
  open: boolean;
  onClose: () => void;
}

const MemoryRestoreRequestDialog: React.FC<MemoryRestoreRequestDialogProps> = ({
  open,
  onClose
}) => {
  const { t } = useTranslation();
  const { createRequest, isSubmitting } = useMemoryRestore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    window.setTimeout(() => {
      setError(null);
      setSuccess(false);
    }, 200);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      await createRequest();
      setSuccess(true);
    } catch (caught: unknown) {
      const message =
        caught && typeof caught === 'object' && 'response' in caught
          ? (caught as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || t('crypto.memoryRestore.requestFailed'));
    }
  };

  return (
    <ResponsiveDialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('crypto.memoryRestore.requestTitle')}</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success">{t('crypto.memoryRestore.requestSuccess')}</Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              {t('crypto.memoryRestore.requestDescription')}
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {success ? (
          <Button onClick={handleClose} variant="contained">
            {t('crypto.memoryRestore.close')}
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={isSubmitting}>
              {t('crypto.memoryRestore.cancel')}
            </Button>
            <Button onClick={() => void handleSubmit()} variant="contained" disabled={isSubmitting}>
              {isSubmitting
                ? t('crypto.memoryRestore.requesting')
                : t('crypto.memoryRestore.requestSubmit')}
            </Button>
          </>
        )}
      </DialogActions>
    </ResponsiveDialog>
  );
};

export default MemoryRestoreRequestDialog;

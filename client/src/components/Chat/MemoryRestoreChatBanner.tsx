import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useMemoryRestore } from '../../contexts/MemoryRestoreContext';

const MemoryRestoreChatBanner: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { pendingIncoming, isSubmitting, acceptAndRestore, declineRequest } = useMemoryRestore();
  const [error, setError] = useState<string | null>(null);

  if (!pendingIncoming) {
    return null;
  }

  const handleAccept = async () => {
    setError(null);
    try {
      await acceptAndRestore(pendingIncoming._id);
    } catch (caught: unknown) {
      const message =
        caught && typeof caught === 'object' && 'response' in caught
          ? (caught as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || t('crypto.memoryRestore.acceptFailed'));
    }
  };

  const handleDecline = async () => {
    setError(null);
    try {
      await declineRequest(pendingIncoming._id);
    } catch (caught: unknown) {
      const message =
        caught && typeof caught === 'object' && 'response' in caught
          ? (caught as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(message || t('crypto.memoryRestore.declineFailed'));
    }
  };

  return (
    <Box
      sx={{
        px: 1.5,
        pt: 1,
        pb: 0,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.92 : 0.72)
      }}
    >
      <Alert
        severity="info"
        sx={{
          alignItems: 'center',
          '& .MuiAlert-message': { width: '100%' }
        }}
        action={
          <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
            <Button
              color="inherit"
              size="small"
              disabled={isSubmitting}
              onClick={() => void handleDecline()}
            >
              {t('settings.partner.requests.decline')}
            </Button>
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              disabled={isSubmitting}
              onClick={() => void handleAccept()}
            >
              {t('crypto.memoryRestore.restore')}
            </Button>
          </Box>
        }
      >
        {error || t('crypto.memoryRestore.chatBanner')}
      </Alert>
    </Box>
  );
};

export default MemoryRestoreChatBanner;

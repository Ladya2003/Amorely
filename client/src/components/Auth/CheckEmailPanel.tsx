import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ResendVerificationResult } from '../../contexts/AuthContext';
import {
  getAuthAlertSx,
  getAuthFormTitleSx,
  getAuthLinkButtonSx,
  getAuthPrimaryButtonSx,
  getAuthSwitchTextSx,
} from './authPageStyles';

const formatCountdown = (totalSeconds: number): string => {
  const seconds = Math.max(0, totalSeconds);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

interface CheckEmailPanelProps {
  email: string;
  onResend: (email: string) => Promise<ResendVerificationResult>;
  onBack: () => void;
  isLoading: boolean;
  /** Initial cooldown after registration / first send (seconds). */
  initialResendAvailableInSeconds?: number;
}

const CheckEmailPanel: React.FC<CheckEmailPanelProps> = ({
  email,
  onResend,
  onBack,
  isLoading,
  initialResendAvailableInSeconds = 60,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.floor(initialResendAvailableInSeconds))
  );

  useEffect(() => {
    setSecondsLeft(Math.max(0, Math.floor(initialResendAvailableInSeconds)));
  }, [initialResendAvailableInSeconds, email]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (secondsLeft > 0 || isLoading) {
      return;
    }
    setResendMessage(null);
    setResendError(null);
    const result = await onResend(email);
    if (result.ok) {
      setResendMessage(t('auth.verify.resendSuccess'));
      setSecondsLeft(Math.max(0, Math.floor(result.resendAvailableInSeconds)));
      return;
    }
    if (result.cooldown && result.resendAvailableInSeconds != null) {
      setSecondsLeft(Math.max(0, Math.floor(result.resendAvailableInSeconds)));
      setResendError(t('auth.verify.resendCooldown'));
      return;
    }
    setResendError(t('auth.verify.resendFailed'));
  };

  const resendDisabled = isLoading || secondsLeft > 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography component="h1" sx={getAuthFormTitleSx()}>
        {t('auth.verify.checkTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('auth.verify.checkBody', { email })}
      </Typography>

      {resendMessage && (
        <Alert severity="success" sx={getAuthAlertSx(theme)} onClose={() => setResendMessage(null)}>
          {resendMessage}
        </Alert>
      )}
      {resendError && (
        <Alert severity="error" sx={getAuthAlertSx(theme)} onClose={() => setResendError(null)}>
          {resendError}
        </Alert>
      )}

      <Button
        fullWidth
        variant="contained"
        sx={getAuthPrimaryButtonSx(theme)}
        onClick={() => void handleResend()}
        disabled={resendDisabled}
      >
        {isLoading
          ? t('auth.verify.resending')
          : secondsLeft > 0
            ? t('auth.verify.resendIn', { time: formatCountdown(secondsLeft) })
            : t('auth.verify.resend')}
      </Button>

      <Box sx={getAuthSwitchTextSx()}>
        <Button onClick={onBack} sx={getAuthLinkButtonSx()} disabled={isLoading}>
          {t('auth.verify.backToLogin')}
        </Button>
      </Box>
    </Box>
  );
};

export default CheckEmailPanel;

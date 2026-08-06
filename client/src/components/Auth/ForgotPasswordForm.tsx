import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AppTextField from '../UI/AppTextField';
import { useAuth } from '../../contexts/AuthContext';
import { translateAuthServerError } from '../../localization/authHelpers';
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

interface ForgotPasswordFormProps {
  onBack: () => void;
  initialEmail?: string;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack, initialEmail = '' }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { requestPasswordReset, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(id);
  }, [secondsLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized || secondsLeft > 0 || isLoading) {
      return;
    }

    setLocalError(null);
    clearError();
    const result = await requestPasswordReset(normalized);
    if (result.ok) {
      setSent(true);
      setSecondsLeft(Math.max(0, Math.floor(result.resendAvailableInSeconds)));
      return;
    }
    if (result.cooldown && result.resendAvailableInSeconds != null) {
      setSent(true);
      setSecondsLeft(Math.max(0, Math.floor(result.resendAvailableInSeconds)));
      setLocalError(t('auth.forgotPassword.resendCooldown'));
      return;
    }
    setLocalError(
      result.message
        ? translateAuthServerError(result.message, t)
        : t('auth.forgotPassword.requestFailed')
    );
  };

  const displayError =
    localError || (error ? translateAuthServerError(error, t) : null);
  const submitDisabled = isLoading || secondsLeft > 0 || !email.trim();

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography component="h1" sx={getAuthFormTitleSx()}>
        {t('auth.forgotPassword.title')}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {sent
          ? t('auth.forgotPassword.sentBody', { email: email.trim().toLowerCase() })
          : t('auth.forgotPassword.body')}
      </Typography>

      {sent && !displayError && (
        <Alert severity="success" sx={getAuthAlertSx(theme)}>
          {t('auth.forgotPassword.sentSuccess')}
        </Alert>
      )}

      {displayError && (
        <Alert
          severity="error"
          sx={getAuthAlertSx(theme)}
          onClose={() => {
            setLocalError(null);
            clearError();
          }}
        >
          {displayError}
        </Alert>
      )}

      {!sent && (
        <AppTextField
          margin="normal"
          required
          fullWidth
          id="forgot-email"
          label={t('auth.email')}
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={getAuthPrimaryButtonSx(theme)}
        disabled={submitDisabled}
      >
        {isLoading
          ? t('auth.forgotPassword.submitting')
          : secondsLeft > 0
            ? t('auth.forgotPassword.resendIn', { time: formatCountdown(secondsLeft) })
            : sent
              ? t('auth.forgotPassword.resend')
              : t('auth.forgotPassword.submit')}
      </Button>

      <Box sx={getAuthSwitchTextSx()}>
        <Button
          onClick={() => {
            clearError();
            onBack();
          }}
          sx={getAuthLinkButtonSx()}
          disabled={isLoading}
        >
          {t('auth.forgotPassword.backToLogin')}
        </Button>
      </Box>
    </Box>
  );
};

export default ForgotPasswordForm;

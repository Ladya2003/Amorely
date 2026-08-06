import React, { useState } from 'react';
import { Alert, Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import AppTextField from '../UI/AppTextField';
import {
  getAuthAlertSx,
  getAuthFormTitleSx,
  getAuthLinkButtonSx,
  getAuthPrimaryButtonSx,
  getAuthSwitchTextSx,
} from './authPageStyles';

interface GoogleUsernameStepProps {
  email: string;
  suggestedUsername: string;
  isLoading: boolean;
  error: string | null;
  onSubmit: (username: string) => Promise<void>;
  onCancel: () => void;
  onClearError: () => void;
}

const GoogleUsernameStep: React.FC<GoogleUsernameStepProps> = ({
  email,
  suggestedUsername,
  isLoading,
  error,
  onSubmit,
  onCancel,
  onClearError,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [username, setUsername] = useState(suggestedUsername);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    onClearError();
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setValidationError(t('auth.google.usernameTooShort'));
      return;
    }
    await onSubmit(trimmed);
  };

  const displayError = validationError || error;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography component="h1" sx={getAuthFormTitleSx()}>
        {t('auth.google.chooseUsernameTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('auth.google.chooseUsernameHint', { email })}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {t('auth.google.usernameChangeLater')}
      </Typography>

      {displayError && (
        <Alert
          severity="error"
          sx={getAuthAlertSx(theme)}
          onClose={() => {
            setValidationError(null);
            onClearError();
          }}
        >
          {displayError}
        </Alert>
      )}

      <AppTextField
        margin="normal"
        required
        fullWidth
        id="google-username"
        label={t('auth.register.username')}
        name="username"
        autoComplete="username"
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={getAuthPrimaryButtonSx(theme)}
        disabled={isLoading}
      >
        {isLoading ? t('auth.google.completing') : t('auth.google.complete')}
      </Button>

      <Box sx={getAuthSwitchTextSx()}>
        <Button onClick={onCancel} sx={getAuthLinkButtonSx()} disabled={isLoading}>
          {t('auth.google.cancel')}
        </Button>
      </Box>
    </Box>
  );
};

export default GoogleUsernameStep;

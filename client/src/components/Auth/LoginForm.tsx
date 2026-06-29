import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { translateAuthServerError } from '../../localization/authHelpers';
import { resolveAppLocale } from '../../localization/locale';
import { resolveBlockReasonForLocale } from '../../utils/handleAccountBlocked';
import { useNavigate } from 'react-router-dom';
import {
  getAuthAlertSx,
  getAuthFormTitleSx,
  getAuthLinkButtonSx,
  getAuthPrimaryButtonSx,
  getAuthSwitchTextSx,
} from './authPageStyles';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  initialEmail?: string;
  initialPassword?: string;
  showRegistrationSuccess?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  initialEmail = '',
  initialPassword = '',
  showRegistrationSuccess = false,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { login, isLoading, error, clearError, blockReasons, blockReasonFallback, clearBlockNotice } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    const response = await login(email, password);
    if (response) {
      navigate('/');
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const blockMessage = resolveBlockReasonForLocale(
    blockReasons,
    resolveAppLocale(i18n.language),
    blockReasonFallback
  );
  const translatedError = !blockMessage && error ? translateAuthServerError(error, t) : null;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography component="h1" sx={getAuthFormTitleSx()}>
        {t('auth.login.title')}
      </Typography>

      {showRegistrationSuccess && (
        <Alert severity="success" sx={getAuthAlertSx(theme)}>
          {t('auth.login.registrationSuccess')}
        </Alert>
      )}

      {blockMessage && (
        <Alert severity="error" sx={getAuthAlertSx(theme)} onClose={clearBlockNotice}>
          {blockMessage}
        </Alert>
      )}

      {translatedError && (
        <Alert severity="error" sx={getAuthAlertSx(theme)} onClose={clearError}>
          {translatedError}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={t('auth.email')}
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t('auth.password')}
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={t('auth.togglePasswordVisibility')}
                onClick={handleClickShowPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={getAuthPrimaryButtonSx()}
        disabled={isLoading}
      >
        {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>

      <Box sx={getAuthSwitchTextSx()}>
        {t('auth.login.noAccount')}{' '}
        <Button
          onClick={onSwitchToRegister}
          sx={getAuthLinkButtonSx()}
          disabled={isLoading}
        >
          {t('auth.login.registerLink')}
        </Button>
      </Box>
    </Box>
  );
};

export default LoginForm;

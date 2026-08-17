import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  Divider,
} from '@mui/material';
import AppTextField from '../UI/AppTextField';
import { EMAIL_NOT_VERIFIED_CODE, USE_PASSWORD_LOGIN_CODE, useAuth } from '../../contexts/AuthContext';
import { translateAuthServerError } from '../../localization/authHelpers';
import { resolveAppLocale } from '../../localization/locale';
import { resolveBlockReasonForLocale } from '../../utils/handleAccountBlocked';
import { useNavigate } from 'react-router-dom';
import {
  getAuthAlertSx,
  getAuthDividerSx,
  getAuthFormTitleSx,
  getAuthLinkButtonSx,
  getAuthPrimaryButtonSx,
  getAuthSwitchTextSx,
} from './authPageStyles';
import GoogleSignInButton from './GoogleSignInButton';
import { Visibility, VisibilityOff } from '../UI/icons';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onForgotPassword: (email: string) => void;
  initialEmail?: string;
  initialPassword?: string;
  showRegistrationSuccess?: boolean;
  onGoogleNeedsUsername: (payload: {
    pendingToken: string;
    email: string;
    suggestedUsername: string;
  }) => void;
  onNeedsEmailVerification: (email: string, resendAvailableInSeconds: number) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToRegister,
  onForgotPassword,
  initialEmail = '',
  initialPassword = '',
  showRegistrationSuccess = false,
  onGoogleNeedsUsername,
  onNeedsEmailVerification,
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const {
    login,
    loginWithGoogle,
    isLoading,
    error,
    clearError,
    blockReasons,
    blockReasonFallback,
    clearBlockNotice,
  } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [usePasswordNotice, setUsePasswordNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    setUsePasswordNotice(null);
    const response = await login(email, password);
    if (response) {
      navigate('/');
    }
  };

  useEffect(() => {
    if (error === EMAIL_NOT_VERIFIED_CODE) {
      // Prefer remaining server cooldown when known; otherwise start a 1-minute UI wait.
      onNeedsEmailVerification(email.trim().toLowerCase(), 60);
      clearError();
    }
  }, [error, email, onNeedsEmailVerification, clearError]);

  const handleGoogle = async (idToken: string) => {
    setUsePasswordNotice(null);
    clearError();
    const result = await loginWithGoogle(idToken);
    if (result.kind === 'authenticated') {
      navigate('/');
      return;
    }
    if (result.kind === 'needs_username') {
      onGoogleNeedsUsername(result);
      return;
    }
    if (result.kind === 'use_password') {
      setUsePasswordNotice(result.message);
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
  const translatedError =
    !blockMessage && error && error !== EMAIL_NOT_VERIFIED_CODE && error !== USE_PASSWORD_LOGIN_CODE
      ? translateAuthServerError(error, t)
      : null;
  const passwordConflictMessage =
    usePasswordNotice ||
    (error === USE_PASSWORD_LOGIN_CODE ? t('auth.errors.usePasswordLogin') : null);

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

      {passwordConflictMessage && (
        <Alert severity="info" sx={getAuthAlertSx(theme)} onClose={() => setUsePasswordNotice(null)}>
          {passwordConflictMessage}
        </Alert>
      )}

      {translatedError && (
        <Alert severity="error" sx={getAuthAlertSx(theme)} onClose={clearError}>
          {translatedError}
        </Alert>
      )}

      <AppTextField
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

      <AppTextField
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, mb: 0.5 }}>
        <Button
          type="button"
          onClick={() => onForgotPassword(email.trim().toLowerCase())}
          sx={{ ...getAuthLinkButtonSx(), py: 0.5, minWidth: 0 }}
          disabled={isLoading}
        >
          {t('auth.login.forgotPassword')}
        </Button>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={getAuthPrimaryButtonSx(theme)}
        disabled={isLoading}
      >
        {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>

      <Divider sx={getAuthDividerSx(theme)}>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: '0.6875rem',
          }}
        >
          {t('auth.or')}
        </Typography>
      </Divider>

      <GoogleSignInButton onCredential={handleGoogle} disabled={isLoading} />

      <Box sx={{ ...getAuthSwitchTextSx(), mt: 2.5 }}>
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

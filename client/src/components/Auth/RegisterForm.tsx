import React, { useState } from 'react';
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
import { USE_PASSWORD_LOGIN_CODE, useAuth } from '../../contexts/AuthContext';
import { translateAuthServerError } from '../../localization/authHelpers';
import {
  getAuthAlertSx,
  getAuthDividerSx,
  getAuthFormTitleSx,
  getAuthLinkButtonSx,
  getAuthPrimaryButtonSx,
  getAuthSwitchTextSx,
} from './authPageStyles';
import GoogleSignInButton from './GoogleSignInButton';
import LegalConsentCheckbox from '../Legal/LegalConsentCheckbox';
import { useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '../UI/icons';

interface RegisterFormProps {
  onSwitchToLogin: (credentials?: { email: string; password: string }) => void;
  onGoogleNeedsUsername: (payload: {
    pendingToken: string;
    email: string;
    suggestedUsername: string;
  }) => void;
  onNeedsEmailVerification: (email: string, resendAvailableInSeconds: number) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onGoogleNeedsUsername,
  onNeedsEmailVerification,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    register,
    loginWithGoogle,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalError, setLegalError] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [usePasswordNotice, setUsePasswordNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationError(null);
    clearError();
    setUsePasswordNotice(null);

    if (!email || !username || !password || !confirmPassword) {
      setValidationError(t('auth.register.errors.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      setValidationError(t('auth.register.errors.passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setValidationError(t('auth.register.errors.passwordTooShort'));
      return;
    }

    if (!acceptedLegal) {
      setLegalError(true);
      setValidationError(t('legal.consent.required'));
      return;
    }

    try {
      const response = await register(email, username, password);
      if (response?.data?.needsEmailVerification) {
        const verifiedEmail = response.data.email || email.trim().toLowerCase();
        const seconds =
          Number(response.data.resendAvailableInSeconds) ||
          (response.data.emailSendFailed ? 0 : 60);
        onNeedsEmailVerification(verifiedEmail, seconds);
        return;
      }
      if (response?.status === 201) {
        onSwitchToLogin({ email, password });
      }
    } catch {
      // Ошибка уже обрабатывается в контексте
    }
  };

  const handleGoogle = async (idToken: string) => {
    if (!acceptedLegal) {
      setLegalError(true);
      setValidationError(t('legal.consent.required'));
      return;
    }
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

  const translatedError =
    error && error !== USE_PASSWORD_LOGIN_CODE ? translateAuthServerError(error, t) : null;
  const displayError = validationError || translatedError;
  const passwordConflictMessage =
    usePasswordNotice ||
    (error === USE_PASSWORD_LOGIN_CODE ? t('auth.errors.usePasswordLogin') : null);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography component="h1" sx={getAuthFormTitleSx()}>
        {t('auth.register.title')}
      </Typography>

      {passwordConflictMessage && (
        <Alert severity="info" sx={getAuthAlertSx(theme)} onClose={() => setUsePasswordNotice(null)}>
          {passwordConflictMessage}
        </Alert>
      )}

      {displayError && (
        <Alert
          severity="error"
          sx={getAuthAlertSx(theme)}
          onClose={() => {
            clearError();
            setValidationError(null);
          }}
        >
          {displayError}
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
        id="username"
        label={t('auth.register.username')}
        name="username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
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
        autoComplete="new-password"
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
        helperText={t('auth.register.passwordMinHint')}
      />

      <AppTextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label={t('auth.register.confirmPassword')}
        type={showPassword ? 'text' : 'password'}
        id="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
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

      <LegalConsentCheckbox
        checked={acceptedLegal}
        onChange={(checked) => {
          setAcceptedLegal(checked);
          if (checked) {
            setLegalError(false);
          }
        }}
        disabled={isLoading}
        error={legalError}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={getAuthPrimaryButtonSx(theme)}
        disabled={isLoading}
      >
        {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
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
        {t('auth.register.hasAccount')}{' '}
        <Button
          onClick={() => onSwitchToLogin()}
          sx={getAuthLinkButtonSx()}
          disabled={isLoading}
        >
          {t('auth.register.loginLink')}
        </Button>
      </Box>
    </Box>
  );
};

export default RegisterForm;

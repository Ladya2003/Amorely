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
import {
  getAuthAlertSx,
  getAuthFormTitleSx,
  getAuthLinkButtonSx,
  getAuthPrimaryButtonSx,
  getAuthSwitchTextSx,
} from './authPageStyles';

interface RegisterFormProps {
  onSwitchToLogin: (credentials?: { email: string; password: string }) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { register, logout, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setValidationError(null);
    clearError();

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

    try {
      const response = await register(email, username, password);
      if (response?.status === 201) {
        logout();
        onSwitchToLogin({ email, password });
      }
    } catch {
      // Ошибка уже обрабатывается в контексте
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const translatedError = error ? translateAuthServerError(error, t) : null;
  const displayError = validationError || translatedError;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography component="h1" sx={getAuthFormTitleSx()}>
        {t('auth.register.title')}
      </Typography>

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
        id="username"
        label={t('auth.register.username')}
        name="username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
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

      <TextField
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

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={getAuthPrimaryButtonSx()}
        disabled={isLoading}
      >
        {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
      </Button>

      <Box sx={getAuthSwitchTextSx()}>
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

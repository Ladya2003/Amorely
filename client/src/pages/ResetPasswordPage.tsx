import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Typography,
  useTheme,
} from '@mui/material';
import AppTextField from '../components/UI/AppTextField';
import { useAuth } from '../contexts/AuthContext';
import { translateAuthServerError } from '../localization/authHelpers';
import { getLandingPath, resolvePreferredLandingLocale } from '../localization/landingLocale';
import { savePendingEmailVerification } from '../utils/pendingEmailVerification';
import {
  getAuthAlertSx,
  getAuthFormTitleSx,
  getAuthPageCardSx,
  getAuthPageContainerSx,
  getAuthPageLogoIconSx,
  getAuthPageLogoRowSx,
  getAuthPageLogoTitleSx,
  getAuthPageRootSx,
  getAuthPrimaryButtonSx,
} from '../components/Auth/authPageStyles';
import { FavoriteIcon, Visibility, VisibilityOff } from '../components/UI/icons';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isLoading, error, clearError } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(
    token ? null : t('auth.forgotPassword.missingToken')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setLocalError(t('auth.forgotPassword.missingToken'));
      return;
    }
    if (!password || !confirmPassword) {
      setLocalError(t('auth.forgotPassword.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setLocalError(t('auth.forgotPassword.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      setLocalError(t('auth.forgotPassword.passwordTooShort'));
      return;
    }

    setLocalError(null);
    clearError();
    const result = await resetPassword(token, password);
    if (!result.ok) {
      return;
    }
    if (result.authenticated) {
      navigate('/', { replace: true });
      return;
    }
    if (result.needsEmailVerification && result.email) {
      savePendingEmailVerification(result.email, 60);
      navigate(getLandingPath(resolvePreferredLandingLocale()), { replace: true });
    }
  };

  const displayError = localError || (error ? translateAuthServerError(error, t) : null);

  return (
    <Box component="main" sx={getAuthPageRootSx(theme)}>
      <Container maxWidth="sm" sx={getAuthPageContainerSx({ safeAreaTop: true })}>
        <Box sx={{ ...getAuthPageLogoRowSx(), mb: 3, justifyContent: 'center' }}>
          <FavoriteIcon sx={getAuthPageLogoIconSx(theme)} />
          <Typography component="div" sx={getAuthPageLogoTitleSx()}>
            Amorely
          </Typography>
        </Box>
        <Box sx={getAuthPageCardSx(theme)}>
          <Typography component="h1" sx={getAuthFormTitleSx()}>
            {t('auth.forgotPassword.resetTitle')}
          </Typography>

          {!token ? (
            <>
              {displayError && (
                <Alert severity="error" sx={getAuthAlertSx(theme)}>
                  {displayError}
                </Alert>
              )}
              <Button
                fullWidth
                variant="contained"
                sx={getAuthPrimaryButtonSx(theme)}
                onClick={() => navigate(getLandingPath(resolvePreferredLandingLocale()))}
              >
                {t('auth.forgotPassword.backToLogin')}
              </Button>
            </>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('auth.forgotPassword.resetBody')}
              </Typography>

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

              <AppTextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('auth.forgotPassword.newPassword')}
                type={showPassword ? 'text' : 'password'}
                id="reset-password"
                autoComplete="new-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                helperText={t('auth.register.passwordMinHint')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={t('auth.togglePasswordVisibility')}
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <AppTextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label={t('auth.register.confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                id="reset-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={getAuthPrimaryButtonSx(theme)}
                disabled={isLoading}
              >
                {isLoading ? t('auth.forgotPassword.resetting') : t('auth.forgotPassword.resetSubmit')}
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;

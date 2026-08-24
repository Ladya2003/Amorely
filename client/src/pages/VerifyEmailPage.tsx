import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Container, Typography, useTheme } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { translateAuthServerError } from '../localization/authHelpers';
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
import { getLandingPath, resolvePreferredLandingLocale } from '../localization/landingLocale';
import { FavoriteIcon } from '../components/UI/icons';
import BrandLoader from '../components/common/BrandLoader';

/** Share one verify call per token across Strict Mode remounts. */
const verifyOnceByToken = new Map<string, Promise<boolean>>();

const VerifyEmailPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { verifyEmail, error } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [localError, setLocalError] = useState<string | null>(
    token ? null : t('auth.verify.missingToken')
  );
  const verifyEmailRef = useRef(verifyEmail);
  verifyEmailRef.current = verifyEmail;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setLocalError(t('auth.verify.missingToken'));
      return;
    }

    let cancelled = false;

    let verifyPromise = verifyOnceByToken.get(token);
    if (!verifyPromise) {
      verifyPromise = verifyEmailRef.current(token).then((ok) => {
        // Keep successes cached (Strict Mode remount); allow retry after failure.
        if (!ok) {
          verifyOnceByToken.delete(token);
        }
        return ok;
      });
      verifyOnceByToken.set(token, verifyPromise);
    }

    void verifyPromise.then((ok) => {
      if (cancelled) {
        return;
      }
      if (ok) {
        setStatus('success');
        navigate('/', { replace: true });
        return;
      }
      setStatus('error');
    });

    return () => {
      cancelled = true;
    };
  }, [token, navigate, t]);

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
            {t('auth.verify.pageTitle')}
          </Typography>

          {status === 'loading' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <BrandLoader size={48} />
            </Box>
          )}

          {status === 'error' && displayError && (
            <Alert severity="error" sx={getAuthAlertSx(theme)}>
              {displayError}
            </Alert>
          )}

          {status === 'error' && (
            <Button
              fullWidth
              variant="contained"
              sx={getAuthPrimaryButtonSx(theme)}
              onClick={() => navigate(getLandingPath(resolvePreferredLandingLocale()))}
            >
              {t('auth.verify.backToLogin')}
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default VerifyEmailPage;

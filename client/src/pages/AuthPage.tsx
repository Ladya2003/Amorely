import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, Button, Fab, Fade, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import GoogleUsernameStep from '../components/Auth/GoogleUsernameStep';
import CheckEmailPanel from '../components/Auth/CheckEmailPanel';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';
import AuthLanding, { AuthLandingMode } from '../components/Auth/AuthLanding';
import AuthLandingClosing from '../components/Auth/AuthLandingClosing';
import AuthLandingFree from '../components/Auth/AuthLandingFree';
import RevealOnScroll from '../components/Auth/RevealOnScroll';
import LanguageSelector from '../components/UI/LanguageSelector';
import FavoriteIcon from '@mui/icons-material/Favorite';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { shouldUseBilingualLanguageLabelOnLogin } from '../localization/locale';
import { applyLandingDocumentSeo } from '../localization/landingSeo';
import { translateAuthServerError } from '../localization/authHelpers';
import { useAuth } from '../contexts/AuthContext';
import {
  getPendingResendSecondsLeft,
  readPendingEmailVerification,
  savePendingEmailVerification,
  type PendingEmailVerification,
} from '../utils/pendingEmailVerification';
import {
  getAuthLandingCtaButtonSx,
  getAuthPageCardSx,
  getAuthPageContainerSx,
  getAuthPageLogoIconSx,
  getAuthPageLogoRowSx,
  getAuthPageLogoTitleSx,
  getAuthPageRootSx,
  getAuthLandingTopBarSx,
  getAuthLandingTopBarInnerSx,
  getAuthPageTopBarActionsSx,
  getAuthScrollTopFabSx,
  getAuthSectionSx,
  getAuthTaglineSx,
} from '../components/Auth/authPageStyles';

const AUTH_SECTION_ID = 'auth-section';
const SCROLL_TOP_SHOW_OFFSET = 480;

type GooglePendingSignup = {
  pendingToken: string;
  email: string;
  suggestedUsername: string;
};

const AuthPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { completeGoogleSignup, resendVerification, isLoading, error, clearError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loginPrefill, setLoginPrefill] = useState<{ email: string; password: string } | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [googlePending, setGooglePending] = useState<GooglePendingSignup | null>(null);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string | null>(null);
  const [pendingEmailVerification, setPendingEmailVerification] = useState<PendingEmailVerification | null>(
    () => readPendingEmailVerification()
  );
  /** Session-only hide after "Back to sign in"; F5 restores panel from localStorage. */
  const [pendingEmailDismissed, setPendingEmailDismissed] = useState(false);

  useEffect(() => {
    return applyLandingDocumentSeo({
      language: i18n.language,
      title: t('auth.landing.documentTitle'),
      description: t('auth.landing.documentDescription'),
      keywords: t('auth.landing.documentKeywords'),
      ogTitle: t('auth.landing.ogTitle'),
      ogDescription: t('auth.landing.ogDescription'),
    });
  }, [t, i18n.language]);

  useEffect(() => {
    const updateVisibility = () => {
      setShowScrollTop(window.scrollY > SCROLL_TOP_SHOW_OFFSET);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const showCheckEmail =
    Boolean(pendingEmailVerification) &&
    !pendingEmailDismissed &&
    !googlePending &&
    forgotPasswordEmail === null;
  const showForgotPassword = forgotPasswordEmail !== null && !googlePending;

  useEffect(() => {
    if (!googlePending && !showCheckEmail && !showForgotPassword) {
      return;
    }
    window.requestAnimationFrame(() => {
      document.getElementById(AUTH_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [googlePending, showCheckEmail, showForgotPassword]);

  const handleNeedsEmailVerification = useCallback((email: string, resendAvailableInSeconds: number) => {
    const pending = savePendingEmailVerification(email, resendAvailableInSeconds);
    setPendingEmailVerification(pending);
    setPendingEmailDismissed(false);
    setGooglePending(null);
    setForgotPasswordEmail(null);
    setIsLogin(true);
    setRegistrationSuccess(false);
  }, []);

  const handleForgotPassword = useCallback((email: string) => {
    setForgotPasswordEmail(email);
    setGooglePending(null);
    setPendingEmailDismissed(true);
    setRegistrationSuccess(false);
    clearError();
  }, [clearError]);

  const handleResendVerification = useCallback(
    async (email: string) => {
      const result = await resendVerification(email);
      if (result.ok) {
        const pending = savePendingEmailVerification(email, result.resendAvailableInSeconds);
        setPendingEmailVerification(pending);
      } else if (result.cooldown && result.resendAvailableInSeconds != null) {
        const pending = savePendingEmailVerification(email, result.resendAvailableInSeconds);
        setPendingEmailVerification(pending);
      }
      return result;
    },
    [resendVerification]
  );

  const handleSwitchToRegister = () => {
    setLoginPrefill(null);
    setRegistrationSuccess(false);
    setForgotPasswordEmail(null);
    setIsLogin(false);
  };

  const handleSwitchToLogin = (credentials?: { email: string; password: string }) => {
    if (credentials) {
      setLoginPrefill(credentials);
      setRegistrationSuccess(true);
    } else {
      setLoginPrefill(null);
      setRegistrationSuccess(false);
    }
    setForgotPasswordEmail(null);
    setIsLogin(true);
  };

  const scrollToAuth = useCallback((mode: AuthLandingMode) => {
    setIsLogin(mode === 'login');
    setForgotPasswordEmail(null);
    if (mode === 'register') {
      setLoginPrefill(null);
      setRegistrationSuccess(false);
    }

    const scrollToSection = () => {
      document.getElementById(AUTH_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollToSection);
    });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <Box component="main" sx={getAuthPageRootSx(theme)}>
      <Box sx={getAuthLandingTopBarSx(theme)}>
        <Box sx={getAuthLandingTopBarInnerSx()}>
          <Box sx={getAuthPageLogoRowSx()}>
            <FavoriteIcon sx={{ ...getAuthPageLogoIconSx(theme), fontSize: 28 }} />
            <Typography component="div" sx={{ ...getAuthPageLogoTitleSx(), fontSize: '1.25rem' }}>
              Amorely
            </Typography>
          </Box>
          <Box sx={getAuthPageTopBarActionsSx()}>
            <LanguageSelector
              bilingualLabel={shouldUseBilingualLanguageLabelOnLogin()}
              syncLandingPath
            />
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => scrollToAuth('login')}
              sx={{
                ...getAuthLandingCtaButtonSx(theme),
                py: 0.75,
                fontSize: '0.8125rem',
                minWidth: { xs: 92, sm: 104 },
                px: { xs: 1.75, sm: 2.25 },
              }}
            >
              {t('auth.landing.ctaLogin')}
            </Button>
          </Box>
        </Box>
      </Box>

      <Container maxWidth="md" sx={getAuthPageContainerSx()}>
        <AuthLanding onScrollToAuth={scrollToAuth} />

        <AuthLandingFree onScrollToAuth={scrollToAuth} />

        <RevealOnScroll>
          <Box id={AUTH_SECTION_ID} sx={getAuthSectionSx()}>
            <Box sx={getAuthPageCardSx(theme)}>
              {googlePending ? (
                <GoogleUsernameStep
                  email={googlePending.email}
                  suggestedUsername={googlePending.suggestedUsername}
                  isLoading={isLoading}
                  error={error ? translateAuthServerError(error, t) : null}
                  onClearError={clearError}
                  onCancel={() => {
                    setGooglePending(null);
                    clearError();
                  }}
                  onSubmit={async (username) => {
                    const ok = await completeGoogleSignup(googlePending.pendingToken, username);
                    if (ok) {
                      setGooglePending(null);
                      navigate('/');
                    }
                  }}
                />
              ) : showForgotPassword ? (
                <ForgotPasswordForm
                  initialEmail={forgotPasswordEmail || ''}
                  onBack={() => {
                    setForgotPasswordEmail(null);
                    clearError();
                    setIsLogin(true);
                  }}
                />
              ) : showCheckEmail && pendingEmailVerification ? (
                <CheckEmailPanel
                  email={pendingEmailVerification.email}
                  onResend={handleResendVerification}
                  onBack={() => {
                    setPendingEmailDismissed(true);
                    clearError();
                    setIsLogin(true);
                  }}
                  isLoading={isLoading}
                  initialResendAvailableInSeconds={getPendingResendSecondsLeft(pendingEmailVerification)}
                />
              ) : isLogin ? (
                <LoginForm
                  onSwitchToRegister={handleSwitchToRegister}
                  onForgotPassword={handleForgotPassword}
                  initialEmail={loginPrefill?.email}
                  initialPassword={loginPrefill?.password}
                  showRegistrationSuccess={registrationSuccess}
                  onGoogleNeedsUsername={setGooglePending}
                  onNeedsEmailVerification={handleNeedsEmailVerification}
                />
              ) : (
                <RegisterForm
                  onSwitchToLogin={handleSwitchToLogin}
                  onGoogleNeedsUsername={setGooglePending}
                  onNeedsEmailVerification={handleNeedsEmailVerification}
                />
              )}
            </Box>
            <Typography sx={getAuthTaglineSx()}>{t('auth.tagline')}</Typography>
          </Box>
        </RevealOnScroll>

        <AuthLandingClosing />
      </Container>

      <Fade in={showScrollTop} unmountOnExit>
        <Fab
          size="medium"
          color="primary"
          aria-label={t('auth.landing.scrollToTopAria')}
          onClick={scrollToTop}
          sx={getAuthScrollTopFabSx(theme)}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Fade>
    </Box>
  );
};

export default AuthPage;

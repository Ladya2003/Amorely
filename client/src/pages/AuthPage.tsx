import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, Button, Fab, Fade, useTheme } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import AuthLanding, { AuthLandingMode } from '../components/Auth/AuthLanding';
import AuthLandingClosing from '../components/Auth/AuthLandingClosing';
import RevealOnScroll from '../components/Auth/RevealOnScroll';
import LanguageSelector from '../components/UI/LanguageSelector';
import FavoriteIcon from '@mui/icons-material/Favorite';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { shouldUseBilingualLanguageLabelOnLogin } from '../localization/locale';
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

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loginPrefill, setLoginPrefill] = useState<{ email: string; password: string } | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = t('auth.landing.documentTitle');
    return () => {
      document.title = previousTitle;
    };
  }, [t]);

  useEffect(() => {
    const updateVisibility = () => {
      setShowScrollTop(window.scrollY > SCROLL_TOP_SHOW_OFFSET);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const handleSwitchToRegister = () => {
    setLoginPrefill(null);
    setRegistrationSuccess(false);
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
    setIsLogin(true);
  };

  const scrollToAuth = useCallback((mode: AuthLandingMode) => {
    setIsLogin(mode === 'login');
    if (mode === 'register') {
      setLoginPrefill(null);
      setRegistrationSuccess(false);
    }

    const scrollToSection = () => {
      document.getElementById(AUTH_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Двойной rAF — после commit layout с зарезервированными высотами картинок
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
            <LanguageSelector bilingualLabel={shouldUseBilingualLanguageLabelOnLogin()} />
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

        <RevealOnScroll>
          <Box id={AUTH_SECTION_ID} sx={getAuthSectionSx()}>
            <Box sx={getAuthPageCardSx(theme)}>
              {isLogin ? (
                <LoginForm
                  onSwitchToRegister={handleSwitchToRegister}
                  initialEmail={loginPrefill?.email}
                  initialPassword={loginPrefill?.password}
                  showRegistrationSuccess={registrationSuccess}
                />
              ) : (
                <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
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

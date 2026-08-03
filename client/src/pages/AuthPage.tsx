import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, Button, useTheme } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import AuthLanding, { AuthLandingMode } from '../components/Auth/AuthLanding';
import AuthLandingClosing from '../components/Auth/AuthLandingClosing';
import RevealOnScroll from '../components/Auth/RevealOnScroll';
import LanguageSelector from '../components/UI/LanguageSelector';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { shouldUseBilingualLanguageLabelOnLogin } from '../localization/locale';
import {
  getAuthOutlinedButtonSx,
  getAuthPageCardSx,
  getAuthPageContainerSx,
  getAuthPageLogoIconSx,
  getAuthPageLogoRowSx,
  getAuthPageLogoTitleSx,
  getAuthPageRootSx,
  getAuthLandingTopBarSx,
  getAuthLandingTopBarInnerSx,
  getAuthPageTopBarActionsSx,
  getAuthSectionSx,
  getAuthTaglineSx,
} from '../components/Auth/authPageStyles';

const AUTH_SECTION_ID = 'auth-section';

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loginPrefill, setLoginPrefill] = useState<{ email: string; password: string } | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = t('auth.landing.documentTitle');
    return () => {
      document.title = previousTitle;
    };
  }, [t]);

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
    window.requestAnimationFrame(() => {
      document.getElementById(AUTH_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => scrollToAuth('login')}
              sx={{ ...getAuthOutlinedButtonSx(theme), display: { xs: 'none', sm: 'inline-flex' } }}
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

        <AuthLandingClosing onScrollToAuth={scrollToAuth} />
      </Container>
    </Box>
  );
};

export default AuthPage;

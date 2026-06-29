import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Box, Typography, useTheme } from '@mui/material';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import LanguageSelector from '../components/UI/LanguageSelector';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { shouldUseBilingualLanguageLabelOnLogin } from '../localization/locale';
import {
  getAuthPageCardSx,
  getAuthPageContainerSx,
  getAuthPageLogoIconSx,
  getAuthPageLogoRowSx,
  getAuthPageLogoTitleSx,
  getAuthPageRootSx,
  getAuthPageTopBarSx,
  getAuthTaglineSx,
} from '../components/Auth/authPageStyles';

const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loginPrefill, setLoginPrefill] = useState<{ email: string; password: string } | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

  return (
    <Box component="main" sx={getAuthPageRootSx(theme)}>
      <Container maxWidth="xs" sx={getAuthPageContainerSx()}>
        <Box sx={getAuthPageTopBarSx()}>
          <LanguageSelector bilingualLabel={shouldUseBilingualLanguageLabelOnLogin()} />
        </Box>

        <Box sx={getAuthPageLogoRowSx()}>
          <FavoriteIcon sx={getAuthPageLogoIconSx(theme)} />
          <Typography component="div" sx={getAuthPageLogoTitleSx()}>
            Amorely
          </Typography>
        </Box>

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
      </Container>
    </Box>
  );
};

export default AuthPage;

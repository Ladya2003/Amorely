import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, useTheme } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import RevealOnScroll from './RevealOnScroll';
import { AuthLandingMode } from './AuthLanding';
import {
  getAuthLandingClosingCtaSx,
  getAuthLandingClosingLeadSx,
  getAuthLandingClosingSx,
  getAuthLandingClosingTitleSx,
  getAuthLandingFooterMetaSx,
  getAuthLandingFooterSx,
  getAuthLandingValueItemSx,
  getAuthLandingValuesSx,
  getAuthOutlinedButtonSx,
  getAuthPrimaryButtonSx,
} from './authPageStyles';

interface AuthLandingClosingProps {
  onScrollToAuth: (mode: AuthLandingMode) => void;
}

const VALUE_IDS = ['private', 'forTwo', 'anywhere'] as const;

const VALUE_ICONS = {
  private: LockOutlinedIcon,
  forTwo: FavoriteBorderOutlinedIcon,
  anywhere: DevicesOutlinedIcon,
} as const;

const AuthLandingClosing: React.FC<AuthLandingClosingProps> = ({ onScrollToAuth }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box component="section" aria-label={t('auth.landing.closing.ariaLabel')}>
      <RevealOnScroll>
        <Box sx={getAuthLandingClosingSx(theme)}>
          <Typography component="h2" sx={getAuthLandingClosingTitleSx()}>
            {t('auth.landing.closing.title')}
          </Typography>
          <Typography sx={getAuthLandingClosingLeadSx()}>
            {t('auth.landing.closing.lead')}
          </Typography>

          <Box sx={getAuthLandingValuesSx()}>
            {VALUE_IDS.map((id) => {
              const Icon = VALUE_ICONS[id];
              return (
                <Box key={id} sx={getAuthLandingValueItemSx()}>
                  <Icon color="primary" fontSize="small" aria-hidden />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
                    {t(`auth.landing.closing.values.${id}.title`)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.5 }}>
                    {t(`auth.landing.closing.values.${id}.body`)}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box sx={getAuthLandingClosingCtaSx()}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onScrollToAuth('register')}
              sx={{ ...getAuthPrimaryButtonSx(), mt: 0, mb: 0 }}
            >
              {t('auth.landing.ctaRegister')}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => onScrollToAuth('login')}
              sx={getAuthOutlinedButtonSx(theme)}
            >
              {t('auth.landing.ctaLogin')}
            </Button>
          </Box>
        </Box>
      </RevealOnScroll>

      <RevealOnScroll delayMs={80}>
        <Box component="footer" sx={getAuthLandingFooterSx()}>
          <Typography sx={getAuthLandingFooterMetaSx()}>
            {t('auth.landing.closing.footerBrand')}
          </Typography>
          <Typography sx={{ ...getAuthLandingFooterMetaSx(), mt: 0.75, opacity: 0.85 }}>
            {t('auth.landing.closing.footerNote')}
          </Typography>
        </Box>
      </RevealOnScroll>
    </Box>
  );
};

export default AuthLandingClosing;

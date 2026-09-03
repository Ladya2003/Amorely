import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import RevealOnScroll from './RevealOnScroll';
import AuthLandingFaq from './AuthLandingFaq';
import AuthLandingReviews from './AuthLandingReviews';
import AuthLandingSocial from './AuthLandingSocial';
import {
  getAuthLandingClosingLeadSx,
  getAuthLandingClosingSx,
  getAuthLandingClosingTitleSx,
  getAuthLandingValueItemSx,
  getAuthLandingValuesSx,
} from './authPageStyles';
import SiteFooter from '../Legal/SiteFooter';
import { DevicesOutlinedIcon, FavoriteBorderOutlinedIcon, LockOutlinedIcon } from '../UI/icons';

const VALUE_IDS = ['private', 'forTwo', 'anywhere'] as const;

const VALUE_ICONS = {
  private: LockOutlinedIcon,
  forTwo: FavoriteBorderOutlinedIcon,
  anywhere: DevicesOutlinedIcon,
} as const;

const AuthLandingClosing: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <>
      <Box component="section" aria-label={t('auth.landing.closing.ariaLabel')}>
        <RevealOnScroll>
          <Box sx={getAuthLandingClosingSx(theme)}>
            <Typography component="h1" sx={getAuthLandingClosingTitleSx()}>
              {t('auth.landing.closing.title')}
            </Typography>
            <Typography sx={getAuthLandingClosingLeadSx()}>
              {t('auth.landing.closing.lead')}
            </Typography>

            <Box sx={{ ...getAuthLandingValuesSx(), mb: 0 }}>
              {VALUE_IDS.map((id) => {
                const Icon = VALUE_ICONS[id];
                return (
                  <Box key={id} sx={getAuthLandingValueItemSx()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon color="primary" fontSize="small" aria-hidden />
                      <Typography
                        component="h3"
                        sx={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}
                      >
                        {t(`auth.landing.closing.values.${id}.title`)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.5 }}>
                      {t(`auth.landing.closing.values.${id}.body`)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </RevealOnScroll>
      </Box>

      <AuthLandingReviews />

      <AuthLandingFaq />

      <AuthLandingSocial />

      <RevealOnScroll delayMs={80}>
        <SiteFooter />
      </RevealOnScroll>
    </>
  );
};

export default AuthLandingClosing;

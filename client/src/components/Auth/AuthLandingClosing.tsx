import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import RevealOnScroll from './RevealOnScroll';
import {
  getAuthLandingClosingLeadSx,
  getAuthLandingClosingSx,
  getAuthLandingClosingTitleSx,
  getAuthLandingFooterMetaSx,
  getAuthLandingFooterSx,
  getAuthLandingValueItemSx,
  getAuthLandingValuesSx,
} from './authPageStyles';

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
    <Box component="section" aria-label={t('auth.landing.closing.ariaLabel')}>
      <RevealOnScroll>
        <Box sx={getAuthLandingClosingSx(theme)}>
          <Typography component="h2" sx={getAuthLandingClosingTitleSx()}>
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
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', letterSpacing: '-0.01em' }}>
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

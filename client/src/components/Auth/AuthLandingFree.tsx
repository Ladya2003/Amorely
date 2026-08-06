import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography, useTheme } from '@mui/material';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RevealOnScroll from './RevealOnScroll';
import {
  getAuthLandingCtaButtonSx,
  getAuthLandingFreeLeadSx,
  getAuthLandingFreePointSx,
  getAuthLandingFreePointsSx,
  getAuthLandingFreeSx,
  getAuthLandingFreeTitleSx,
} from './authPageStyles';
import { AuthLandingMode } from './AuthLanding';

const FREE_POINT_IDS = ['noPaywall', 'fullAccess', 'invitePartner'] as const;

interface AuthLandingFreeProps {
  onScrollToAuth: (mode: AuthLandingMode) => void;
}

const AuthLandingFree: React.FC<AuthLandingFreeProps> = ({ onScrollToAuth }) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box component="section" aria-label={t('auth.landing.free.ariaLabel')}>
      <RevealOnScroll>
        <Box sx={getAuthLandingFreeSx(theme)}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
              color: 'primary.main',
            }}
          >
            <CardGiftcardOutlinedIcon fontSize="large" aria-hidden />
          </Box>
          <Typography component="h2" sx={getAuthLandingFreeTitleSx()}>
            {t('auth.landing.free.title')}
          </Typography>
          <Typography sx={getAuthLandingFreeLeadSx()}>{t('auth.landing.free.lead')}</Typography>

          <Box sx={getAuthLandingFreePointsSx()}>
            {FREE_POINT_IDS.map((id) => (
              <Typography key={id} component="p" sx={getAuthLandingFreePointSx()}>
                <CheckCircleOutlineIcon
                  color="primary"
                  fontSize="small"
                  aria-hidden
                  sx={{ mt: '2px', flexShrink: 0 }}
                />
                <span>{t(`auth.landing.free.points.${id}`)}</span>
              </Typography>
            ))}
          </Box>

          <Box sx={{ mt: { xs: 3, sm: 3.5 } }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onScrollToAuth('register')}
              sx={getAuthLandingCtaButtonSx(theme)}
            >
              {t('auth.landing.free.cta')}
            </Button>
          </Box>
        </Box>
      </RevealOnScroll>
    </Box>
  );
};

export default AuthLandingFree;

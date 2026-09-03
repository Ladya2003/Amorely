import React from 'react';
import { Box, Link, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SOCIAL_LINKS } from '../../legal/publicSite';
import { InstagramIcon, TiktokIcon, YoutubeIcon, type AppIconComponent } from '../UI/icons';
import RevealOnScroll from './RevealOnScroll';
import {
  getAuthLandingSocialLeadSx,
  getAuthLandingSocialLinkSx,
  getAuthLandingSocialLinksSx,
  getAuthLandingSocialSx,
  getAuthLandingSocialTitleSx,
} from './authPageStyles';

const SOCIAL_ITEMS: Array<{
  id: 'instagram' | 'tiktok' | 'youtube';
  href: string;
  Icon: AppIconComponent;
}> = [
  { id: 'instagram', href: SOCIAL_LINKS.instagram, Icon: InstagramIcon },
  { id: 'tiktok', href: SOCIAL_LINKS.tiktok, Icon: TiktokIcon },
  { id: 'youtube', href: SOCIAL_LINKS.youtube, Icon: YoutubeIcon },
];

const AuthLandingSocial: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box component="section" aria-label={t('auth.landing.social.ariaLabel')} sx={getAuthLandingSocialSx()}>
      <RevealOnScroll>
        <Typography component="h2" sx={getAuthLandingSocialTitleSx()}>
          {t('auth.landing.social.title')}
        </Typography>
        <Typography sx={getAuthLandingSocialLeadSx()}>{t('auth.landing.social.lead')}</Typography>
        <Box component="nav" aria-label={t('legal.footer.socialAria')} sx={getAuthLandingSocialLinksSx()}>
          {SOCIAL_ITEMS.map(({ id, href, Icon }) => (
            <Link
              key={id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(`legal.footer.${id}Aria`)}
              sx={getAuthLandingSocialLinkSx(theme)}
            >
              <Icon fontSize="small" aria-hidden />
            </Link>
          ))}
        </Box>
      </RevealOnScroll>
    </Box>
  );
};

export default AuthLandingSocial;

import React from 'react';
import { Box, Link, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { KAIF_LIFE_URL, SOCIAL_LINKS } from '../../legal/publicSite';
import { InstagramIcon, KaifLifeIcon, TiktokIcon, YoutubeIcon, type AppIconComponent } from '../UI/icons';
import RevealOnScroll from './RevealOnScroll';
import {
  getAuthLandingSocialLeadSx,
  getAuthLandingSocialLinkSx,
  getAuthLandingSocialLinksSx,
  getAuthLandingSocialSx,
  getAuthLandingSocialTitleSx,
} from './authPageStyles';

const SOCIAL_ITEMS: Array<{
  id: 'instagram' | 'tiktok' | 'youtube' | 'kaifLife';
  href: string;
  Icon: AppIconComponent;
}> = [
  { id: 'instagram', href: SOCIAL_LINKS.instagram, Icon: InstagramIcon },
  { id: 'tiktok', href: SOCIAL_LINKS.tiktok, Icon: TiktokIcon },
  { id: 'youtube', href: SOCIAL_LINKS.youtube, Icon: YoutubeIcon },
  { id: 'kaifLife', href: KAIF_LIFE_URL, Icon: KaifLifeIcon },
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
              title={t(`legal.footer.${id}Aria`)}
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

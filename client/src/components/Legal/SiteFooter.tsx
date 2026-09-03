import React from 'react';
import { Box, Link, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { PUBLIC_PATHS, SOCIAL_LINKS, SUPPORT_EMAIL } from '../../legal/publicSite';
import { getAuthLandingFooterMetaSx, getAuthLandingFooterSx } from '../Auth/authPageStyles';
import { InstagramIcon, TiktokIcon, YoutubeIcon, type AppIconComponent } from '../UI/icons';
import {
  getFooterContactSx,
  getFooterLinkSx,
  getFooterLinksSx,
  getFooterSocialLinkSx,
  getFooterSocialsSx,
} from './legalPageStyles';

const SOCIAL_ITEMS: Array<{
  id: 'instagram' | 'tiktok' | 'youtube';
  href: string;
  Icon: AppIconComponent;
}> = [
  { id: 'instagram', href: SOCIAL_LINKS.instagram, Icon: InstagramIcon },
  { id: 'tiktok', href: SOCIAL_LINKS.tiktok, Icon: TiktokIcon },
  { id: 'youtube', href: SOCIAL_LINKS.youtube, Icon: YoutubeIcon },
];

const FOOTER_LINKS = [
  { to: PUBLIC_PATHS.terms, key: 'legal.footer.terms' },
  { to: PUBLIC_PATHS.privacy, key: 'legal.footer.privacy' },
  { to: PUBLIC_PATHS.offer, key: 'legal.footer.offer' },
  { to: PUBLIC_PATHS.payment, key: 'legal.footer.payment' },
  { to: PUBLIC_PATHS.support, key: 'legal.footer.support' },
  { to: PUBLIC_PATHS.blog, key: 'legal.footer.blog' },
] as const;

const SiteFooter: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box component="footer" sx={getAuthLandingFooterSx()}>
      <Box component="nav" aria-label={t('legal.footer.socialAria')} sx={getFooterSocialsSx()}>
        {SOCIAL_ITEMS.map(({ id, href, Icon }) => (
          <Link
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(`legal.footer.${id}Aria`)}
            sx={getFooterSocialLinkSx(theme)}
          >
            <Icon fontSize="small" aria-hidden />
          </Link>
        ))}
      </Box>
      <Box sx={getFooterLinksSx()}>
        {FOOTER_LINKS.map((item) => (
          <Link
            key={item.to}
            component={RouterLink}
            to={item.to}
            underline="none"
            sx={getFooterLinkSx(theme)}
          >
            {t(item.key)}
          </Link>
        ))}
      </Box>
      <Typography sx={getFooterContactSx()}>
        {t('legal.footer.contactLead')}{' '}
        <Link
          href={`mailto:${SUPPORT_EMAIL}`}
          underline="none"
          aria-label={t('legal.footer.contactAria')}
          sx={getFooterLinkSx(theme)}
        >
          {SUPPORT_EMAIL}
        </Link>
      </Typography>
      <Typography sx={getAuthLandingFooterMetaSx()}>{t('auth.landing.closing.footerBrand')}</Typography>
      <Typography sx={{ ...getAuthLandingFooterMetaSx(), mt: 0.75, opacity: 0.85 }}>
        {t('auth.landing.closing.footerNote')}
      </Typography>
    </Box>
  );
};

export default SiteFooter;

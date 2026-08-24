import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { Box, Button, Container, Fab, Fade, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  applyPublicDocumentSeo,
  type PublicPageOgImage,
} from '../../localization/publicPageSeo';
import { shouldUseBilingualLanguageLabelOnLogin } from '../../localization/locale';
import { getPublicHomePath, getPublicSignInPath } from '../../legal/publicSite';
import {
  getAuthLandingCtaButtonSx,
  getAuthLandingTopBarInnerSx,
  getAuthLandingTopBarSx,
  getAuthPageContainerSx,
  getAuthPageLogoIconSx,
  getAuthPageLogoRowSx,
  getAuthPageLogoTitleSx,
  getAuthPageRootSx,
  getAuthPageTopBarActionsSx,
  getAuthScrollTopFabSx,
} from '../Auth/authPageStyles';
import LanguageSelector from '../UI/LanguageSelector';
import { FavoriteIcon, KeyboardArrowUpIcon } from '../UI/icons';
import SiteFooter from './SiteFooter';

const SCROLL_TOP_SHOW_OFFSET = 480;

type PublicSiteLayoutProps = {
  children: React.ReactNode;
  documentTitle: string;
  documentDescription: string;
  keywords: string;
  seoPath: string;
  ogType?: 'website' | 'article';
  ogImage?: PublicPageOgImage;
  jsonLd?: Record<string, unknown>[];
  maxWidth?: 'sm' | 'md' | 'lg';
};

const PublicSiteLayout: React.FC<PublicSiteLayoutProps> = ({
  children,
  documentTitle,
  documentDescription,
  keywords,
  seoPath,
  ogType,
  ogImage,
  jsonLd,
  maxWidth = 'md',
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    return applyPublicDocumentSeo({
      language: i18n.language,
      title: documentTitle,
      description: documentDescription,
      keywords,
      path: seoPath,
      ogType,
      ogImage,
      jsonLd,
    });
  }, [documentDescription, documentTitle, i18n.language, jsonLd, keywords, ogImage, ogType, seoPath]);

  useEffect(() => {
    const updateVisibility = () => {
      setShowScrollTop(window.scrollY > SCROLL_TOP_SHOW_OFFSET);
    };
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const homePath = getPublicHomePath(isAuthenticated);

  return (
    <Box component="main" sx={getAuthPageRootSx(theme)}>
      <Box sx={getAuthLandingTopBarSx(theme)}>
        <Box sx={getAuthLandingTopBarInnerSx()}>
          <Box
            component={RouterLink}
            to={homePath}
            sx={{ ...getAuthPageLogoRowSx(), textDecoration: 'none', color: 'inherit' }}
          >
            <FavoriteIcon sx={{ ...getAuthPageLogoIconSx(theme), fontSize: 28 }} />
            <Typography component="div" sx={{ ...getAuthPageLogoTitleSx(), fontSize: '1.25rem' }}>
              Amorely
            </Typography>
          </Box>
          <Box sx={getAuthPageTopBarActionsSx()}>
            <LanguageSelector bilingualLabel={shouldUseBilingualLanguageLabelOnLogin()} />
            <Button
              component={RouterLink}
              to={isAuthenticated ? '/' : getPublicSignInPath()}
              variant="contained"
              color="primary"
              size="small"
              sx={{
                ...getAuthLandingCtaButtonSx(theme),
                py: 0.75,
                fontSize: '0.8125rem',
                minWidth: { xs: 92, sm: 104 },
                px: { xs: 1.75, sm: 2.25 },
              }}
            >
              {isAuthenticated ? t('legal.openApp') : t('auth.landing.ctaLogin')}
            </Button>
          </Box>
        </Box>
      </Box>

      <Container maxWidth={maxWidth} sx={getAuthPageContainerSx()}>
        {children}
        <SiteFooter />
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

export default PublicSiteLayout;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { LOCALE_LABELS, resolveAppLocale } from '../../localization/locale';
import { isLocaleBannerDismissed, markLocaleBannerDismissed } from './feedBannerStorage';
import FeedDismissibleBanner from './FeedDismissibleBanner';

const LocaleBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const currentLocale = resolveAppLocale(i18n.language);
  const languageLabel = LOCALE_LABELS[currentLocale];

  return (
    <FeedDismissibleBanner
      initiallyVisible={!isLocaleBannerDismissed()}
      onDismissPersist={markLocaleBannerDismissed}
      onBannerClick={() => navigate('/settings?tab=theme')}
      closeAriaLabel={t('feed.localeBanner.closeAriaLabel')}
    >
      <Box sx={{ display: 'flex', gap: 1.5, pr: 3 }}>
        <LanguageIcon sx={{ color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t('feed.localeBanner.title', { language: languageLabel })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('feed.localeBanner.description')}
          </Typography>
        </Box>
      </Box>
    </FeedDismissibleBanner>
  );
};

export default LocaleBanner;

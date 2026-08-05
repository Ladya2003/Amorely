import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useAuth } from '../../contexts/AuthContext';
import { LOCALE_LABELS, resolveAppLocale } from '../../localization/locale';
import { updateUiPreferences } from '../../services/uiPreferencesService';
import { isLocaleBannerDismissedOnAccount } from './feedBannerStorage';
import FeedDismissibleBanner from './FeedDismissibleBanner';

const LocaleBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading, updateUser } = useAuth();

  const currentLocale = resolveAppLocale(i18n.language);
  const languageLabel = LOCALE_LABELS[currentLocale];

  if (isLoading || !user) {
    return null;
  }

  const handleDismissPersist = () => {
    const dismissedAt = new Date().toISOString();
    updateUser({ ...user, localeBannerDismissedAt: dismissedAt });
    void updateUiPreferences({ dismissLocaleBanner: true }).catch((error) => {
      console.error('Не удалось сохранить скрытие баннера языка:', error);
    });
  };

  return (
    <FeedDismissibleBanner
      key={`locale-banner-${user._id}-${user.localeBannerDismissedAt ?? 'visible'}`}
      initiallyVisible={!isLocaleBannerDismissedOnAccount(user)}
      onDismissPersist={handleDismissPersist}
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

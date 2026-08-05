import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import { getHomeScreenNewsPath } from '../../constants/homeScreenNews';
import { useAuth } from '../../contexts/AuthContext';
import { updateUiPreferences } from '../../services/uiPreferencesService';
import { canShowInstallBanner } from './feedBannerStorage';
import FeedDismissibleBanner from './FeedDismissibleBanner';

const InstallAppBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading, updateUser } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  const handleDismissPersist = () => {
    updateUser({ ...user, installBannerDismissed: true });
    void updateUiPreferences({ dismissInstallBanner: true }).catch((error) => {
      console.error('Не удалось сохранить скрытие баннера установки:', error);
    });
  };

  return (
    <FeedDismissibleBanner
      key={`install-banner-${user._id}-${user.installBannerDismissed ? 'hidden' : user.localeBannerDismissedAt ?? 'pending'}`}
      initiallyVisible={canShowInstallBanner(user)}
      onDismissPersist={handleDismissPersist}
      onBannerClick={() => navigate(getHomeScreenNewsPath())}
      closeAriaLabel={t('feed.installBanner.closeAriaLabel')}
    >
      <Box sx={{ display: 'flex', gap: 1.5, pr: 3 }}>
        <InstallMobileIcon sx={{ color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {t('feed.installBanner.title')}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, textDecoration: 'underline' }}
          >
            {t('feed.installBanner.learnMore')}
          </Typography>
        </Box>
      </Box>
    </FeedDismissibleBanner>
  );
};

export default InstallAppBanner;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import { getHomeScreenNewsPath } from '../../constants/homeScreenNews';
import {
  canShowInstallBanner,
  markInstallBannerDismissed,
} from './feedBannerStorage';

const InstallAppBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(canShowInstallBanner);

  if (!isVisible) {
    return null;
  }

  const handleDismiss = (event: React.MouseEvent) => {
    event.stopPropagation();
    markInstallBannerDismissed();
    setIsVisible(false);
  };

  const handleBannerClick = () => {
    navigate(getHomeScreenNewsPath());
  };

  return (
    <Paper
      elevation={0}
      onClick={handleBannerClick}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: 'action.selected',
        },
      }}
    >
      <IconButton
        size="small"
        aria-label={t('feed.installBanner.closeAriaLabel')}
        onClick={handleDismiss}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          color: 'text.secondary',
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

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
    </Paper>
  );
};

export default InstallAppBanner;

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Paper, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import { LOCALE_LABELS, resolveAppLocale } from '../../localization/locale';
import { isLocaleBannerDismissed, markLocaleBannerDismissed } from './feedBannerStorage';

const LocaleBanner: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(isLocaleBannerDismissed);

  if (isDismissed) {
    return null;
  }

  const currentLocale = resolveAppLocale(i18n.language);
  const languageLabel = LOCALE_LABELS[currentLocale];

  const handleDismiss = (event: React.MouseEvent) => {
    event.stopPropagation();
    markLocaleBannerDismissed();
    setIsDismissed(true);
  };

  const handleBannerClick = () => {
    navigate('/settings?tab=theme');
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
        aria-label={t('feed.localeBanner.closeAriaLabel')}
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
    </Paper>
  );
};

export default LocaleBanner;

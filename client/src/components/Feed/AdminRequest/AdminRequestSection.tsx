import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAdminRequestSectionSx } from './adminRequestStyles';

const AdminRequestSection: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      role="button"
      tabIndex={0}
      id="admin-request"
      onClick={() => navigate('/write-admin')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate('/write-admin');
        }
      }}
      sx={getAdminRequestSectionSx(theme)}
      aria-label={t('feed.adminRequest.sectionAria')}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '16px',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            bgcolor: (currentTheme) =>
              currentTheme.palette.mode === 'light'
                ? 'rgba(255,255,255,0.55)'
                : 'rgba(0,0,0,0.22)',
            color: 'primary.main',
          }}
        >
          <SupportAgentIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.25 }}>
            {t('feed.adminRequest.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            {t('feed.adminRequest.sectionHint')}
          </Typography>
        </Box>
        <ChevronRightIcon color="action" />
      </Box>
    </Paper>
  );
};

export default AdminRequestSection;

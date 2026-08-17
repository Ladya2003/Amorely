import React from 'react';
import { Box, Container, IconButton, Paper, Typography, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminRequestForm from '../components/Feed/AdminRequest/AdminRequestForm';
import {
  getAdminRequestCardSx,
  getAdminRequestPageRootSx,
} from '../components/Feed/AdminRequest/adminRequestStyles';
import { ArrowBackIcon } from '../components/UI/icons';

const AdminRequestPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={getAdminRequestPageRootSx(theme)}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/')} aria-label={t('common.back')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            {t('feed.adminRequest.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('feed.adminRequest.subtitle')}
          </Typography>
        </Box>
      </Box>

      <Paper elevation={0} sx={getAdminRequestCardSx(theme)}>
        <AdminRequestForm />
      </Paper>
    </Container>
  );
};

export default AdminRequestPage;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Box, Typography } from '@mui/material';
import UserProfileChip from '../UI/UserProfileChip';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminAlerts } from '../../contexts/AdminAlertsContext';

const FeedHeader: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { feedDot } = useAdminAlerts();
  const isAdmin = user?.role === 'admin';

  const handleTitleClick = () => {
    if (isAdmin) {
      navigate('/admin');
    }
  };

  const title = (
    <Typography
      variant="h5"
      component="span"
      onClick={handleTitleClick}
      sx={{
        fontWeight: 400,
        fontSize: '1.7rem',
        ...(isAdmin && {
          cursor: 'pointer',
          '&:hover': { opacity: 0.8 },
        }),
      }}
    >
      {t('feed.title')}
    </Typography>
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        gap: 2,
      }}>
        {isAdmin ? (
          <Badge
            color="error"
            variant="dot"
            invisible={!feedDot}
            overlap="rectangular"
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{
              '& .MuiBadge-badge': {
                top: 4,
                right: -2,
              },
            }}
          >
            {title}
          </Badge>
        ) : (
          title
        )}
        
        <UserProfileChip sx={{ maxWidth: '60%' }} />
      </Box>
    </Box>
  );
};

export default FeedHeader;

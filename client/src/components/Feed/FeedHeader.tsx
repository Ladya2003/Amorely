import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import UserProfileChip from '../UI/UserProfileChip';
import { useAuth } from '../../contexts/AuthContext';

const FeedHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleTitleClick = () => {
    if (isAdmin) {
      navigate('/admin');
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        gap: 2,
      }}>
        <Typography
          variant="h5"
          component="h1"
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
          Лента
        </Typography>
        
        <UserProfileChip sx={{ maxWidth: '60%' }} />
      </Box>
    </Box>
  );
};

export default FeedHeader;

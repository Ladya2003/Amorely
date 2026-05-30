import React from 'react';
import { Box, Typography } from '@mui/material';
import UserProfileChip from '../UI/UserProfileChip';

const FeedHeader: React.FC = () => {
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
          sx={{ fontWeight: 400, fontSize: '1.7rem' }}
        >
          Лента
        </Typography>
        
        <UserProfileChip sx={{ maxWidth: '60%' }} />
      </Box>
    </Box>
  );
};

export default FeedHeader;

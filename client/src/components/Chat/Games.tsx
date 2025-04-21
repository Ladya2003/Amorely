import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Games: React.FC = () => {
  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        p: 2
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url(https://source.unsplash.com/random/800x600/?love)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            opacity: 0.7
          }}
        />
        <Typography 
          variant="h4" 
          component="h2" 
          align="center"
          sx={{ 
            position: 'relative',
            zIndex: 1,
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            fontWeight: 'bold',
            p: 3
          }}
        >
          все будет, но не сразу ❤️
        </Typography>
      </Paper>
    </Box>
  );
};

export default Games; 
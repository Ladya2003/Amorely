import React from 'react';
import { Box, BottomNavigationAction } from '@mui/material';

export interface BottomNavTabProps {
  value: number;
  label: string;
  icon: React.ReactNode;
}

const BottomNavTab: React.FC<BottomNavTabProps> = ({ value, label, icon, ...muiInjected }) => (
  <BottomNavigationAction
    value={value}
    showLabel={false}
    label=""
    icon={
      <Box
        className="bottom-nav-tab-content"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        <Box
          className="bottom-nav-tab-icon"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box
          component="span"
          className="bottom-nav-tab-label"
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            lineHeight: 1.2,
            textAlign: 'center',
            '@media (max-width:360px)': {
              fontSize: '0.625rem',
            },
          }}
        >
          {label}
        </Box>
      </Box>
    }
    sx={{
      '& .MuiBottomNavigationAction-label': {
        display: 'none',
        width: 0,
        height: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      },
    }}
    {...(muiInjected as React.ComponentProps<typeof BottomNavigationAction>)}
  />
);

export default BottomNavTab;

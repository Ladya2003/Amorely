import React from 'react';
import { Box, BottomNavigation, SxProps, Theme } from '@mui/material';
import {
  getAnimatedBottomNavActionStyles,
  getBottomNavIndicatorSx,
  BOTTOM_NAV_HEIGHT,
} from './bottomNavStyles';

interface AnimatedBottomNavProps {
  value: number | false;
  onChange: (event: React.SyntheticEvent, value: number) => void;
  sx?: SxProps<Theme>;
  tabCount?: number;
  children: React.ReactNode;
}

const AnimatedBottomNav: React.FC<AnimatedBottomNavProps> = ({
  value,
  onChange,
  sx,
  tabCount = 5,
  children,
}) => {
  const selectedIndex = typeof value === 'number' ? value : -1;
  const navigationValue = typeof value === 'number' ? value : false;

  return (
    <Box sx={{ position: 'relative', overflow: 'visible' }}>
      {selectedIndex >= 0 && (
        <Box
          aria-hidden
          sx={(theme) => getBottomNavIndicatorSx(theme, selectedIndex, tabCount)}
        />
      )}
      <BottomNavigation
        showLabels={false}
        value={navigationValue}
        onChange={onChange}
        sx={[
          (theme) => ({
            position: 'relative',
            zIndex: 1,
            bgcolor: 'transparent',
            height: BOTTOM_NAV_HEIGHT,
            '& .MuiBottomNavigationAction-root': {
              ...getAnimatedBottomNavActionStyles(theme),
              minWidth: 0,
            },
          }),
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
      >
        {children}
      </BottomNavigation>
    </Box>
  );
};

export default AnimatedBottomNav;

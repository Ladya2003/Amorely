import React from 'react';
import { Box, Portal } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FortuneWheelSceneBackground from './FortuneWheelSceneBackground';
import { getFortuneWheelPageRootSx, getFortuneWheelPageShellSx } from './fortuneWheelStyles';

interface FortuneWheelPageShellProps {
  children: React.ReactNode;
}

const FortuneWheelPageShell: React.FC<FortuneWheelPageShellProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <Portal>
      <Box sx={getFortuneWheelPageShellSx(theme)}>
        <FortuneWheelSceneBackground />
        <Box sx={getFortuneWheelPageRootSx()}>{children}</Box>
      </Box>
    </Portal>
  );
};

export default FortuneWheelPageShell;

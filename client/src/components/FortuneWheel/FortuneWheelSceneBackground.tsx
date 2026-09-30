import React from 'react';
import { Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { FORTUNE_WHEEL_SCENE_IMAGE, getFortuneWheelSceneBackgroundSx } from './fortuneWheelStyles';

const FortuneWheelSceneBackground: React.FC = () => {
  const theme = useTheme();

  return (
    <Box aria-hidden sx={getFortuneWheelSceneBackgroundSx()}>
      <Box
        sx={{
          position: 'absolute',
          inset: '-8%',
          backgroundImage: `url(${FORTUNE_WHEEL_SCENE_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 42%',
          filter: 'blur(28px) saturate(1.08)',
          transform: 'scale(1.06)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: alpha(theme.palette.common.black, 0.58),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            180deg,
            ${alpha(theme.palette.common.black, 0.35)} 0%,
            ${alpha(theme.palette.common.black, 0.2)} 38%,
            ${alpha(theme.palette.common.black, 0.55)} 100%
          )`,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(
            ellipse 72% 58% at 50% 46%,
            ${alpha(theme.palette.primary.main, 0.14)} 0%,
            transparent 68%
          )`,
        }}
      />
    </Box>
  );
};

export default FortuneWheelSceneBackground;

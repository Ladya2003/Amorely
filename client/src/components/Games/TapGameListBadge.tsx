import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import type { TapGameState } from '../../services/gamesService';
import { getTapGameListBadgeSx } from './gamePlayPageStyles';

interface TapGameListBadgeProps {
  state: TapGameState;
}

const TapGameListBadge: React.FC<TapGameListBadgeProps> = ({ state }) => {
  const theme = useTheme();

  return (
    <Box sx={getTapGameListBadgeSx(theme)}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: 'primary.main',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
          textTransform: 'none',
        }}
      >
        {state.myTapsThisRound}/{state.targetTaps}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: 'secondary.main',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
          textTransform: 'none',
        }}
      >
        {state.partnerProgressThisRound}/{state.targetTaps}
      </Typography>
    </Box>
  );
};

export default TapGameListBadge;

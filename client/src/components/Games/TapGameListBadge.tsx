import React from 'react';
import { Box, Typography } from '@mui/material';
import type { TapGameState } from '../../services/gamesService';

interface TapGameListBadgeProps {
  state: TapGameState;
}

const TapGameListBadge: React.FC<TapGameListBadgeProps> = ({ state }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 0.25,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        pointerEvents: 'none',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: 'primary.main',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.2,
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
        }}
      >
        {state.partnerProgressThisRound}/{state.targetTaps}
      </Typography>
    </Box>
  );
};

export default TapGameListBadge;

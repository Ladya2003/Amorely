import React from 'react';
import { Box, Typography } from '@mui/material';
import type { CliffShopItemId } from '../../../services/gamesService';
import { cliffItemImage } from './cliffAssets';
import { getCliffItemAwardSx, getCliffItemAwardWrapSx, getCliffOreAwardTextSx } from './cliffStyles';

type CliffItemAwardProps = {
  itemId: CliffShopItemId;
};

const CliffItemAward: React.FC<CliffItemAwardProps> = ({ itemId }) => (
  <Box sx={getCliffItemAwardWrapSx()}>
    <Box sx={getCliffItemAwardSx()}>
      <Typography component="span" sx={getCliffOreAwardTextSx()}>
        +
      </Typography>
      <Box
        component="img"
        src={cliffItemImage(itemId)}
        alt=""
        sx={{
          width: 40,
          height: 40,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
        }}
      />
    </Box>
  </Box>
);

export default CliffItemAward;

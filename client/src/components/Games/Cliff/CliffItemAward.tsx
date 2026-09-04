import React from 'react';
import { Box, Typography } from '@mui/material';
import { getCliffItemAwardSx, getCliffItemAwardWrapSx, getCliffOreAwardTextSx } from './cliffStyles';

type CliffItemAwardProps = {
  src: string;
  amount?: number;
};

const CliffItemAward: React.FC<CliffItemAwardProps> = ({ src, amount }) => (
  <Box sx={getCliffItemAwardWrapSx()}>
    <Box sx={getCliffItemAwardSx()}>
      <Typography component="span" sx={getCliffOreAwardTextSx()}>
        +
      </Typography>
      <Box
        component="img"
        src={src}
        alt=""
        sx={{
          width: 40,
          height: 40,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
        }}
      />
      {amount != null && amount > 0 ? (
        <Typography component="span" sx={getCliffOreAwardTextSx()}>
          {amount}
        </Typography>
      ) : null}
    </Box>
  </Box>
);

export default CliffItemAward;

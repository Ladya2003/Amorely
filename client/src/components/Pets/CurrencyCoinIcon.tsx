import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface CurrencyCoinIconProps {
  size?: number;
  sx?: SxProps<Theme>;
}

/** Inline coin icon — avoids broken img when PUBLIC_URL basename differs from dev root. */
const CurrencyCoinIcon: React.FC<CurrencyCoinIconProps> = ({ size = 28, sx }) => (
  <Box
    component="svg"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={size}
    height={size}
    aria-hidden
    sx={{ flexShrink: 0, ...sx }}
  >
    <defs>
      <linearGradient id="amoreCoinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#FFA500" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#amoreCoinGrad)" stroke="#E6A800" strokeWidth="2" />
    <path
      d="M32 47 C32 47 15 33 15 23.5 C15 18 19 14 24 14 C27.5 14 30.5 16 32 19.5 C33.5 16 36.5 14 40 14 C45 14 49 18 49 23.5 C49 33 32 47 32 47 Z"
      fill="#fff"
    />
  </Box>
);

export default CurrencyCoinIcon;

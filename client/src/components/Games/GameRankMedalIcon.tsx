import React, { useId } from 'react';
import { Box } from '@mui/material';
import { normalizeMedalRank } from '../../utils/gameBadges';

export type GameRankMedalVariant = 'gold' | 'silver' | 'bronze';
export type GameRankMedalSize = 'xs' | 'sm' | 'md';

const MEDAL_DIMENSIONS: Record<GameRankMedalSize, number> = {
  xs: 22,
  sm: 26,
  md: 34,
};

export const getMedalSizeForAvatar = (avatarSize: number) =>
  Math.min(48, Math.max(22, Math.round(avatarSize * 0.52)));

export const getRankMedalVariant = (rank: unknown): GameRankMedalVariant | null => {
  const normalizedRank = normalizeMedalRank(rank);
  if (normalizedRank === 1) return 'gold';
  if (normalizedRank === 2) return 'silver';
  if (normalizedRank === 3) return 'bronze';
  return null;
};

const MEDAL_PALETTES: Record<
  GameRankMedalVariant,
  { outer: string; inner: string; highlight: string; ribbon: string; ribbonDark: string }
> = {
  gold: {
    outer: '#FFB300',
    inner: '#FFD54F',
    highlight: '#FFF8E1',
    ribbon: '#ff4b8d',
    ribbonDark: '#e0437d',
  },
  silver: {
    outer: '#7B8794',
    inner: '#C5CDD6',
    highlight: '#F5F7FA',
    ribbon: '#ff4b8d',
    ribbonDark: '#e0437d',
  },
  bronze: {
    outer: '#A0622A',
    inner: '#D4925A',
    highlight: '#FFD9B3',
    ribbon: '#ff4b8d',
    ribbonDark: '#e0437d',
  },
};

interface GameRankMedalIconProps {
  rank: number;
  size?: GameRankMedalSize | number;
}

const GameRankMedalIcon: React.FC<GameRankMedalIconProps> = ({ rank, size = 'sm' }) => {
  const gradientId = useId();
  const variant = getRankMedalVariant(rank);
  if (!variant) {
    return null;
  }

  const dimension = typeof size === 'number' ? size : MEDAL_DIMENSIONS[size];
  const palette = MEDAL_PALETTES[variant];
  const fillGradientId = `${gradientId}-${variant}`;

  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        width: dimension,
        height: dimension,
        display: 'inline-flex',
        flexShrink: 0,
        lineHeight: 0,
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.28))',
      }}
    >
      <svg viewBox="0 0 20 24" width={dimension} height={dimension} fill="none">
        <defs>
          <linearGradient id={fillGradientId} x1="4" y1="2" x2="16" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={palette.highlight} />
            <stop offset="45%" stopColor={palette.inner} />
            <stop offset="100%" stopColor={palette.outer} />
          </linearGradient>
        </defs>
        <path
          d="M5.2 13.2 3.6 21.2 9.8 17.4V13.2H5.2Z"
          fill={palette.ribbonDark}
        />
        <path
          d="M14.8 13.2 16.4 21.2 10.2 17.4V13.2H14.8Z"
          fill={palette.ribbon}
        />
        <circle cx="10" cy="8.5" r="7.2" fill={`url(#${fillGradientId})`} stroke={palette.outer} strokeWidth="0.8" />
        <circle cx="10" cy="8.5" r="5.4" fill="none" stroke={palette.highlight} strokeOpacity="0.55" strokeWidth="0.7" />
        <path
          d="M10 4.8c1.4 1.6 3.4 2.1 4.6 2.1-0.8 1.4-0.8 3.1 0 4.4-1.4-0.4-3-0.2-4.6 1.1-1.6-1.3-3.2-1.5-4.6-1.1 0.8-1.3 0.8-3 0-4.4 1.2 0 3.2-0.5 4.6-2.1Z"
          fill={palette.outer}
          fillOpacity="0.18"
        />
      </svg>
    </Box>
  );
};

export default GameRankMedalIcon;

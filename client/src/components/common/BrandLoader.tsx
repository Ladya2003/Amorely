import React, { useId } from 'react';
import { Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  BRAND_LOADER_DEFAULT_SIZE,
  BRAND_LOADER_FULLSCREEN_SIZE,
  getBrandLoaderBeatSx,
  getBrandLoaderFullscreenSx,
  getBrandLoaderRingSx,
  getBrandLoaderRootSx,
  getBrandLoaderSparkSx,
  getBrandLoaderStageSx,
} from './brandLoaderStyles';

type HeartMarkVariant = 'filled' | 'ring';

interface BrandLoaderProps {
  size?: number;
  fullscreen?: boolean;
}

const HEART_PATH =
  'M49.6 86.8C22.4 65 9.2 48.6 13.1 32.4C16 19.2 30.4 14.6 41.2 23.2C45.6 26.8 48 32.4 49.8 38.2C52.4 31.6 57.2 24.8 65.2 21.8C79.2 15.4 91.2 22.6 89.4 36.8C87.6 52.6 74.8 66.8 49.6 86.8Z';

const SPARKS = [
  { left: '8%', top: '22%', delayMs: 0, size: 5 },
  { left: '86%', top: '18%', delayMs: 220, size: 4 },
  { left: '14%', top: '74%', delayMs: 480, size: 3.5 },
  { left: '80%', top: '70%', delayMs: 160, size: 4 },
] as const;

const HeartMark: React.FC<{ variant: HeartMarkVariant; clipId: string }> = ({ variant, clipId }) => {
  switch (variant) {
    case 'ring':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
          <path
            d={HEART_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'filled':
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
          <defs>
            <clipPath id={clipId}>
              <path d={HEART_PATH} />
            </clipPath>
          </defs>
          <path d={HEART_PATH} fill="currentColor" opacity="0.22" transform="translate(50 52) scale(1.08) translate(-50 -52)" />
          <path d={HEART_PATH} fill="currentColor" />
          <g clipPath={`url(#${clipId})`} stroke="currentColor" strokeWidth="1.15" opacity="0.28">
            <path d="M18 78 L72 18" />
            <path d="M26 84 L80 24" />
            <path d="M36 88 L88 32" />
            <path d="M48 90 L92 42" />
          </g>
          <path
            d={HEART_PATH}
            fill="none"
            stroke="#1b1412"
            strokeWidth="4.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.88"
          />
        </svg>
      );
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
};

const BrandLoader: React.FC<BrandLoaderProps> = ({ size, fullscreen = false }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const clipId = useId().replace(/:/g, '');
  const markSize = size ?? (fullscreen ? BRAND_LOADER_FULLSCREEN_SIZE : BRAND_LOADER_DEFAULT_SIZE);

  const loader = (
    <Box
      role="status"
      aria-live="polite"
      aria-label={t('common.loading')}
      sx={getBrandLoaderRootSx(theme, markSize)}
    >
      <Box sx={getBrandLoaderRingSx(0)}>
        <HeartMark variant="ring" clipId={clipId} />
      </Box>
      <Box sx={getBrandLoaderRingSx(280)}>
        <HeartMark variant="ring" clipId={clipId} />
      </Box>
      <Box sx={getBrandLoaderStageSx()}>
        <Box sx={getBrandLoaderBeatSx()}>
          <HeartMark variant="filled" clipId={clipId} />
        </Box>
      </Box>
      {SPARKS.map((spark) => (
        <Box
          key={`${spark.left}-${spark.top}`}
          sx={getBrandLoaderSparkSx(spark.left, spark.top, spark.delayMs, spark.size)}
        />
      ))}
    </Box>
  );

  if (!fullscreen) {
    return loader;
  }

  return <Box sx={getBrandLoaderFullscreenSx()}>{loader}</Box>;
};

export default BrandLoader;

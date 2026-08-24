import { alpha, Theme } from '@mui/material/styles';

export const BRAND_LOADER_DEFAULT_SIZE = 64;
export const BRAND_LOADER_FULLSCREEN_SIZE = 88;

const REDUCE_MOTION = '@media (prefers-reduced-motion: reduce)';

export const getBrandLoaderFullscreenSx = () => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '100vh',
  bgcolor: 'background.default',
});

export const getBrandLoaderRootSx = (theme: Theme, size: number) => ({
  position: 'relative' as const,
  width: size,
  height: size,
  color: 'primary.main',
  flexShrink: 0,
  '@keyframes brandLoaderBeat': {
    '0%': { transform: 'scale(0.86)' },
    '12%': { transform: 'scale(1.16)' },
    '22%': { transform: 'scale(0.94)' },
    '34%': { transform: 'scale(1.1)' },
    '46%': { transform: 'scale(0.86)' },
    '100%': { transform: 'scale(0.86)' },
  },
  '@keyframes brandLoaderWobble': {
    '0%, 100%': { transform: 'rotate(-9deg)' },
    '50%': { transform: 'rotate(-5deg)' },
  },
  '@keyframes brandLoaderRing': {
    '0%': { transform: 'rotate(-8deg) scale(0.62)', opacity: 0.42 },
    '72%': { opacity: 0.08 },
    '100%': { transform: 'rotate(-8deg) scale(1.72)', opacity: 0 },
  },
  '@keyframes brandLoaderSpark': {
    '0%, 100%': { opacity: 0, transform: 'scale(0.4)' },
    '35%': { opacity: 0.85, transform: 'scale(1)' },
    '60%': { opacity: 0, transform: 'scale(0.5)' },
  },
  [REDUCE_MOTION]: {
    '@keyframes brandLoaderBeat': {
      '0%, 100%': { transform: 'scale(1)' },
    },
    '@keyframes brandLoaderWobble': {
      '0%, 100%': { transform: 'rotate(-8deg)' },
    },
    '@keyframes brandLoaderRing': {
      '0%, 100%': { opacity: 0 },
    },
    '@keyframes brandLoaderSpark': {
      '0%, 100%': { opacity: 0 },
    },
  },
  filter: `drop-shadow(0 8px 18px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.38 : 0.28)})`,
});

export const getBrandLoaderStageSx = () => ({
  position: 'absolute' as const,
  inset: 0,
  transformOrigin: '50% 55%',
  animation: 'brandLoaderWobble 2.8s ease-in-out infinite',
  [REDUCE_MOTION]: {
    animation: 'none',
    transform: 'rotate(-8deg)',
  },
});

export const getBrandLoaderBeatSx = () => ({
  position: 'absolute' as const,
  inset: 0,
  transformOrigin: '50% 55%',
  animation: 'brandLoaderBeat 1.35s cubic-bezier(0.42, 0, 0.22, 1) infinite',
  [REDUCE_MOTION]: {
    animation: 'none',
    transform: 'scale(1)',
  },
});

export const getBrandLoaderRingSx = (delayMs: number) => ({
  position: 'absolute' as const,
  inset: '-18%',
  transformOrigin: '50% 55%',
  animation: 'brandLoaderRing 1.35s ease-out infinite',
  animationDelay: `${delayMs}ms`,
  [REDUCE_MOTION]: {
    animation: 'none',
    opacity: 0,
  },
});

export const getBrandLoaderSparkSx = (left: string, top: string, delayMs: number, sparkSize: number) => ({
  position: 'absolute' as const,
  left,
  top,
  width: sparkSize,
  height: sparkSize,
  borderRadius: '50%',
  bgcolor: 'currentColor',
  animation: 'brandLoaderSpark 1.35s ease-in-out infinite',
  animationDelay: `${delayMs}ms`,
  [REDUCE_MOTION]: {
    animation: 'none',
    opacity: 0,
  },
});

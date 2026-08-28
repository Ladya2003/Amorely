import { alpha, Theme } from '@mui/material/styles';

export const formatCliffTime = (ms: number): string => {
  const safe = Math.max(0, Math.floor(ms));
  const totalSec = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatCliffCountdown = (ms: number): string => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/** Hub art is 1024×1536. Keep the same crop and hotspot layout on every screen. */
export const CLIFF_HUB_ASPECT_RATIO = '2 / 3';

export const getCliffSceneRootSx = () => ({
  position: 'absolute' as const,
  inset: 0,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  containerType: 'size' as const,
});

export const getCliffHubBackdropSx = () => ({
  position: 'absolute' as const,
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none' as const,
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.25)',
    filter: 'blur(32px) brightness(0.58) saturate(1.4)',
  },
  '&::after': {
    content: '""',
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(40, 16, 24, 0.2)',
  },
});

export const getCliffHubStageSx = () => ({
  position: 'relative' as const,
  zIndex: 1,
  aspectRatio: CLIFF_HUB_ASPECT_RATIO,
  width: 'min(100cqw, calc(100cqh * 2 / 3))',
  height: 'min(100cqh, calc(100cqw * 3 / 2))',
  flexShrink: 0,
  overflow: 'hidden',
  containerType: 'size' as const,
});

export const getCliffHudSx = (theme: Theme) => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  zIndex: 6,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'stretch',
  gap: 1.25,
  px: 1,
  py: 0.75,
  background: `linear-gradient(180deg, ${alpha(theme.palette.background.default, 0.82)} 0%, ${alpha(
    theme.palette.background.default,
    0
  )} 100%)`,
});

export const getCliffHudRowSx = (align: 'start' | 'between' = 'start') => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: align === 'between' ? ('space-between' as const) : ('flex-start' as const),
  gap: 0.75,
  flexWrap: 'wrap' as const,
});

export type CliffChipTone = 'hud' | 'parchment';

export const getCliffChipSx = (theme: Theme, tone: CliffChipTone = 'hud') => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  px: 0.75,
  py: 0.35,
  borderRadius: 999,
  fontSize: '0.75rem',
  fontWeight: 800,
  ...(tone === 'parchment'
    ? {
        bgcolor: '#fff8ee',
        border: '1px solid rgba(139, 74, 43, 0.35)',
        color: '#5c2618',
        boxShadow: 'inset 0 1px 0 rgba(255, 248, 238, 0.8)',
      }
    : {
        bgcolor: alpha(theme.palette.background.paper, 0.88),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        color: 'inherit',
        fontWeight: 700,
      }),
});

export const getCliffChipButtonSx = (theme: Theme, tone: CliffChipTone = 'hud') => ({
  ...getCliffChipSx(theme, tone),
  cursor: 'pointer',
  font: 'inherit',
  appearance: 'none' as const,
  WebkitTapHighlightColor: 'transparent',
});

export const getCliffHudIconButtonSx = () => ({
  border: 'none',
  background: 'transparent',
  p: 0,
  lineHeight: 0,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
});

export const getCliffHotspotSx = (hint = false) => ({
  position: 'absolute' as const,
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  '&:focus-visible': {
    outline: '2px solid currentColor',
  },
  '& > :first-of-type': hint
    ? {
        transformOrigin: 'center bottom',
        animation: 'cliffHotspotHint 1.85s ease-in-out infinite',
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      }
    : undefined,
  '@keyframes cliffHotspotHint': {
    '0%, 100%': {
      transform: 'scale(1)',
      filter: 'drop-shadow(0 0 0 rgba(255, 214, 140, 0)) brightness(1)',
    },
    '50%': {
      transform: 'scale(1.08)',
      filter: 'drop-shadow(0 0 14px rgba(255, 214, 140, 0.8)) brightness(1.12)',
    },
  },
});

export const getCliffHotspotBadgeSx = () => ({
  mt: -0.5,
  px: 1,
  py: 0.15,
  borderRadius: 1,
  bgcolor: 'rgba(80, 32, 20, 0.82)',
  color: '#ffe8c8',
  fontWeight: 800,
  letterSpacing: 0.4,
  fontSize: '0.7rem',
  lineHeight: 1.2,
  whiteSpace: 'nowrap' as const,
});

export const CLIFF_OVERLAY_MS = 380;

export type CliffOverlayMotion = 'modal' | 'cave';

const prefersCliffReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const getCliffOverlayDurationMs = () => (prefersCliffReducedMotion() ? 1 : CLIFF_OVERLAY_MS);

const cliffOverlayMotionName = (variant: CliffOverlayMotion, leaving: boolean) => {
  switch (variant) {
    case 'modal':
      return leaving ? 'cliffModalOut' : 'cliffModalIn';
    case 'cave':
      return leaving ? 'cliffCaveOut' : 'cliffCaveIn';
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
};

export const getCliffOverlayPresenceSx = (variant: CliffOverlayMotion, leaving: boolean) => {
  const motionName = cliffOverlayMotionName(variant, leaving);

  return {
    position: 'absolute' as const,
    inset: 0,
    zIndex: 8,
    overflow: 'hidden',
    pointerEvents: leaving ? ('none' as const) : ('auto' as const),
    transformOrigin: 'center center',
    animation: `${motionName} ${CLIFF_OVERLAY_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`,
    '@keyframes cliffModalIn': {
      from: { opacity: 0, transform: 'translateY(18px) scale(0.96)' },
      to: { opacity: 1, transform: 'translateY(0) scale(1)' },
    },
    '@keyframes cliffModalOut': {
      from: { opacity: 1, transform: 'translateY(0) scale(1)' },
      to: { opacity: 0, transform: 'translateY(12px) scale(0.97)' },
    },
    '@keyframes cliffCaveIn': {
      from: { opacity: 0, transform: 'scale(1.12)' },
      to: { opacity: 1, transform: 'scale(1)' },
    },
    '@keyframes cliffCaveOut': {
      from: { opacity: 1, transform: 'scale(1)' },
      to: { opacity: 0, transform: 'scale(1.08)' },
    },
    '@keyframes cliffFadeIn': {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    '@keyframes cliffFadeOut': {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: `${leaving ? 'cliffFadeOut' : 'cliffFadeIn'} 1ms linear both`,
    },
  };
};

export const getCliffMineViewSx = () => ({
  animation: 'cliffMineViewIn 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
  '@keyframes cliffMineViewIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
});

export type CliffMineBoulderSpot = {
  left: string;
  top: string;
  width: string;
  rotate: string;
};

const hashCliffSeed = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createCliffRng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const getCliffMineBoulderSpots = (seed: string, ids: string[]): CliffMineBoulderSpot[] => {
  const rand = createCliffRng(hashCliffSeed(`${seed}:${ids.join('|')}`));
  const placed: Array<{ left: number; top: number; width: number; rotate: number }> = [];
  const packWidth = 21;
  const packHeight = packWidth * 0.82;
  const pad = 2;

  const distance = (
    a: { left: number; top: number; width: number },
    b: { left: number; top: number; width: number }
  ) => {
    const ax = a.left + a.width / 2;
    const ay = a.top + packHeight / 2;
    const bx = b.left + b.width / 2;
    const by = b.top + packHeight / 2;
    const dx = ax - bx;
    const dy = (ay - by) * 1.35;
    return Math.hypot(dx, dy);
  };

  ids.forEach(() => {
    let best = {
      left: pad + rand() * (100 - packWidth - pad * 2),
      top: pad + rand() * (100 - packHeight - pad * 2),
      width: packWidth,
      rotate: (rand() - 0.5) * 10,
    };
    let bestScore = -1;
    for (let attempt = 0; attempt < 56; attempt += 1) {
      const candidate = {
        left: pad + rand() * (100 - packWidth - pad * 2),
        top: pad + rand() * (100 - packHeight - pad * 2),
        width: packWidth,
        rotate: (rand() - 0.5) * 10,
      };
      const nearest =
        placed.length === 0
          ? 100
          : placed.reduce((min, spot) => Math.min(min, distance(candidate, spot)), 100);
      if (nearest > bestScore) {
        best = candidate;
        bestScore = nearest;
      }
    }
    placed.push(best);
  });

  return placed.map((spot) => ({
    left: `${spot.left}%`,
    top: `${spot.top}%`,
    width: `${spot.width}%`,
    rotate: `${spot.rotate}deg`,
  }));
};

export const getCliffMineBackButtonSx = () => ({
  color: '#fff8ee',
  border: '1px solid rgba(255, 248, 238, 0.32)',
  bgcolor: 'rgba(40, 16, 14, 0.38)',
  width: 40,
  height: 40,
  '&:hover': {
    bgcolor: 'rgba(40, 16, 14, 0.55)',
  },
});

export const getCliffMineTitleSx = () => ({
  fontWeight: 800,
  color: '#fff8ee',
  textShadow: '0 1px 6px #0008',
});

export const getCliffMineRefreshSx = () => ({
  ml: 'auto',
  flexShrink: 0,
  fontWeight: 700,
  fontSize: '0.75rem',
  color: 'rgba(255, 236, 210, 0.9)',
  textShadow: '0 1px 6px #0008',
  whiteSpace: 'nowrap' as const,
});

export const CLIFF_BOULDER_HIT_MS = 320;
export const CLIFF_BOULDER_BREAK_MS = 1500;

export const getCliffMineTapLabelSx = () => ({
  fontWeight: 800,
  fontSize: '0.68rem',
  lineHeight: 1.2,
  color: '#ffe8c8',
  textAlign: 'center' as const,
  whiteSpace: 'nowrap' as const,
});

export const getCliffMineTapBadgeSx = (roomy = false) => ({
  mt: 0.35,
  px: roomy ? 1.25 : 0.65,
  pt: roomy ? 0.45 : 0.2,
  pb: roomy ? 0.55 : 0.3,
  borderRadius: 1,
  bgcolor: 'rgba(80, 32, 20, 0.8)',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'stretch',
  gap: roomy ? 0.55 : 0.3,
});

export const getCliffMineTapBarSx = (metal: 'iron' | 'copper', progress: number) => {
  let fill = '#ffb15a';
  switch (metal) {
    case 'iron':
      fill = '#9ec8ff';
      break;
    case 'copper':
      fill = '#ffb15a';
      break;
    default: {
      const exhaustive: never = metal;
      return exhaustive;
    }
  }
  return {
    height: 5,
    borderRadius: 999,
    bgcolor: 'rgba(255, 232, 200, 0.2)',
    overflow: 'hidden',
    '& > span': {
      display: 'block',
      height: '100%',
      width: `${Math.max(0, Math.min(100, progress))}%`,
      bgcolor: fill,
      borderRadius: 999,
    },
  };
};

export const getCliffBoulderIdleSx = () => ({
  transformOrigin: 'center bottom',
  animation: 'cliffBoulderIdle 1.55s ease-in-out infinite',
  '@keyframes cliffBoulderIdle': {
    '0%, 100%': {
      transform: 'scale(1)',
      filter: 'drop-shadow(0 0 0 rgba(255, 214, 140, 0)) brightness(1)',
    },
    '50%': {
      transform: 'scale(1.045)',
      filter: 'drop-shadow(0 0 18px rgba(255, 214, 140, 0.6)) brightness(1.1)',
    },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
});

export const getCliffBoulderHitSx = () => ({
  transformOrigin: 'center bottom',
  animation: `cliffBoulderHit ${CLIFF_BOULDER_HIT_MS}ms cubic-bezier(0.18, 0.9, 0.32, 1.2) both`,
  '@keyframes cliffBoulderHit': {
    '0%': { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
    '16%': { transform: 'scale(0.84) rotate(-5deg)', filter: 'brightness(1.55)' },
    '42%': { transform: 'scale(1.12) rotate(4deg)', filter: 'brightness(1.25)' },
    '68%': { transform: 'scale(0.97) rotate(-2deg)', filter: 'brightness(1.08)' },
    '100%': { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
});

export const getCliffBoulderBreakSx = () => ({
  transformOrigin: 'center center',
  animation: `cliffBoulderBreak ${CLIFF_BOULDER_BREAK_MS}ms cubic-bezier(0.22, 0.8, 0.32, 1) both`,
  '@keyframes cliffBoulderBreak': {
    '0%': { transform: 'scale(1) rotate(0deg)', filter: 'brightness(1)', opacity: 1 },
    '12%': { transform: 'scale(1.14) rotate(-3deg)', filter: 'brightness(1.7)', opacity: 1 },
    '28%': { transform: 'scale(1.02) rotate(6deg)', filter: 'brightness(1.35)', opacity: 1 },
    '55%': { transform: 'scale(0.78) rotate(-14deg)', filter: 'brightness(1.1)', opacity: 0.85 },
    '100%': { transform: 'scale(0.28) rotate(22deg)', filter: 'brightness(0.85)', opacity: 0 },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: `cliffBoulderBreak ${CLIFF_BOULDER_BREAK_MS}ms linear both`,
    '@keyframes cliffBoulderBreak': {
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
  },
});

export const getCliffBoulderShardSx = (index: number) => {
  const dirs = [
    { x: -86, y: -48, r: -28 },
    { x: 92, y: -36, r: 24 },
    { x: -28, y: 78, r: -16 },
    { x: 48, y: 72, r: 20 },
  ];
  const dir = dirs[index] ?? dirs[0];
  return {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: 'auto',
    pointerEvents: 'none' as const,
    transformOrigin: 'center center',
    animation: `cliffBoulderShard${index} ${CLIFF_BOULDER_BREAK_MS}ms ease-out both`,
    [`@keyframes cliffBoulderShard${index}`]: {
      '0%': { opacity: 0.95, transform: 'translate(0, 0) scale(0.72) rotate(0deg)' },
      '100%': {
        opacity: 0,
        transform: `translate(${dir.x}px, ${dir.y}px) scale(0.28) rotate(${dir.r}deg)`,
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      opacity: 0,
    },
  };
};

export const getCliffOreAwardSx = () => ({
  position: 'absolute' as const,
  top: '42%',
  left: '50%',
  zIndex: 3,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 2.25,
  py: 1.25,
  borderRadius: 3,
  bgcolor: 'rgba(20, 20, 24, 0.82)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
  pointerEvents: 'none' as const,
  animation: `cliffOreAwardFloat ${CLIFF_BOULDER_BREAK_MS}ms ease-in-out both`,
  '@keyframes cliffOreAwardFloat': {
    '0%': { opacity: 1, transform: 'translate(-50%, -50%) scale(0.92)' },
    '15%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.08)' },
    '70%': { opacity: 1, transform: 'translate(-50%, calc(-50% - 72px)) scale(1.08)' },
    '100%': { opacity: 0, transform: 'translate(-50%, calc(-50% - 96px)) scale(1.12)' },
  },
});

export const getCliffOreAwardTextSx = () => ({
  color: '#fff',
  fontWeight: 800,
  fontSize: '1.85rem',
  lineHeight: 1,
  textShadow: '0 2px 12px rgba(0,0,0,0.65), 0 0 2px rgba(0,0,0,0.8)',
});

export const CLIFF_ITEM_AWARD_MS = 2200;

export const getCliffItemAwardWrapSx = () => ({
  position: 'absolute' as const,
  inset: 0,
  zIndex: 14,
  pointerEvents: 'none' as const,
});

export const getCliffItemAwardSx = () => ({
  ...getCliffOreAwardSx(),
  top: '50%',
  left: '50%',
  animation: `cliffOreAwardFloat ${CLIFF_ITEM_AWARD_MS}ms ease-in-out both`,
});

export const getCliffMineSparkSx = (index: number) => {
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
  const dist = 70 + (index % 2) * 18;
  const x = Math.round(Math.cos(angle) * dist);
  const y = Math.round(Math.sin(angle) * dist);
  return {
    position: 'absolute' as const,
    left: '50%',
    top: '44%',
    width: 9,
    height: 9,
    ml: '-4.5px',
    mt: '-4.5px',
    borderRadius: '50%',
    bgcolor: index % 2 === 0 ? '#ffe08a' : '#fff6d6',
    boxShadow: '0 0 10px rgba(255, 210, 110, 0.9)',
    animation: `cliffMineSpark${index} 430ms ease-out both`,
    [`@keyframes cliffMineSpark${index}`]: {
      '0%': { opacity: 1, transform: 'translate(0, 0) scale(1.15)' },
      '100%': { opacity: 0, transform: `translate(${x}px, ${y}px) scale(0.15)` },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      opacity: 0,
    },
  };
};

export const getCliffMineRippleSx = () => ({
  position: 'absolute' as const,
  left: '18%',
  top: '16%',
  width: '64%',
  height: '64%',
  borderRadius: '50%',
  border: '3px solid rgba(255, 232, 200, 0.85)',
  animation: 'cliffMineRipple 420ms ease-out both',
  pointerEvents: 'none' as const,
  '@keyframes cliffMineRipple': {
    '0%': { opacity: 0.9, transform: 'scale(0.55)' },
    '100%': { opacity: 0, transform: 'scale(1.35)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    opacity: 0,
  },
});

export const getCliffOverlaySx = (theme: Theme) => ({
  position: 'absolute' as const,
  inset: 0,
  zIndex: 8,
  display: 'flex',
  flexDirection: 'column' as const,
  bgcolor: alpha(theme.palette.background.default, 0.94),
});

export const getCliffDialogCardSx = (theme: Theme) => ({
  m: 2,
  p: 2.5,
  borderRadius: 3,
  bgcolor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
});

export const getCliffModalOverlaySx = (zIndex = 8, pinned: 'absolute' | 'fixed' = 'absolute') => ({
  position: pinned,
  inset: 0,
  zIndex,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  p: { xs: 1.5, sm: 2 },
});

export const getCliffModalBackdropSx = () => ({
  position: 'absolute' as const,
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none' as const,
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scale(1.18)',
    filter: 'blur(18px) brightness(0.42) saturate(1.25)',
  },
  '&::after': {
    content: '""',
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(42, 16, 14, 0.38)',
  },
});

export const getCliffModalCardSx = (roomy = false) => ({
  position: 'relative' as const,
  zIndex: 1,
  width: 'min(100%, 440px)',
  maxHeight: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: 0,
  overflow: 'hidden',
  px: 2,
  pt: 1.75,
  pb: 2,
  borderRadius: '18px',
  background: 'linear-gradient(180deg, #fff6e8 0%, #f0d2ae 100%)',
  border: '2px solid #8b4a2b',
  boxShadow: '0 18px 40px rgba(40, 16, 12, 0.48), inset 0 1px 0 rgba(255, 248, 238, 0.55)',
  color: '#4a2414',
  ...(roomy ? { width: 'min(100%, 480px)' } : {}),
});

export const getCliffModalHeroSx = () => ({
  width: '100%',
  maxHeight: 150,
  objectFit: 'contain' as const,
  mb: 1.25,
  flexShrink: 0,
});

export const getCliffModalTitleSx = () => ({
  fontWeight: 800,
  letterSpacing: 0.2,
  color: '#5c2618',
  mb: 1,
  flexShrink: 0,
});

export const getCliffModalBodySx = () => ({
  color: '#6a3a24',
  mb: 2,
});

export const getCliffModalItemSx = () => ({
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 1.25,
  alignItems: 'stretch',
  p: 1.25,
  borderRadius: '12px',
  background: 'rgba(90, 36, 24, 0.07)',
  border: '1px solid rgba(139, 74, 43, 0.28)',
});

export const getCliffModalPrimaryButtonSx = () => ({
  py: 1,
  px: 1.75,
  fontWeight: 800,
  fontSize: '0.875rem',
  textTransform: 'none' as const,
  color: '#ffe8c8',
  bgcolor: '#8a3d28',
  borderRadius: '10px',
  boxShadow: 'none',
  '&:hover': {
    bgcolor: '#6e2f1e',
    boxShadow: 'none',
  },
  '&.Mui-disabled': {
    color: '#fff3e4',
    bgcolor: '#c4a48c',
  },
});

export const getCliffModalBuyButtonSx = () => ({
  ...getCliffModalPrimaryButtonSx(),
  width: '100%',
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center' as const,
});

export const getCliffModalGhostButtonSx = () => ({
  py: 1,
  px: 1.75,
  fontWeight: 700,
  fontSize: '0.8125rem',
  textTransform: 'none' as const,
  color: '#5c2618',
  border: '1.5px solid rgba(92, 38, 24, 0.34)',
  bgcolor: 'rgba(255, 248, 238, 0.72)',
  borderRadius: '10px',
  '&:hover': {
    borderColor: 'rgba(92, 38, 24, 0.5)',
    bgcolor: 'rgba(255, 248, 238, 0.95)',
  },
});

export const getCliffParchmentPanelSx = () => ({
  position: 'absolute' as const,
  left: 8,
  right: 8,
  bottom: 8,
  zIndex: 5,
  p: 1.25,
  borderRadius: '14px',
  background: 'linear-gradient(180deg, #fff6e8 0%, #f0d2ae 100%)',
  border: '2px solid #8b4a2b',
  boxShadow: '0 10px 24px rgba(40, 16, 12, 0.4), inset 0 1px 0 rgba(255, 248, 238, 0.55)',
  color: '#4a2414',
});

export const getCliffBridgePowerWrapSx = () => ({
  position: 'absolute' as const,
  right: '3%',
  bottom: 100,
  zIndex: 4,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: 1,
  pointerEvents: 'auto' as const,
});

export const getCliffBridgePowerTrackSx = () => ({
  width: 28,
  height: 'min(28vh, 168px)',
  borderRadius: '10px',
  overflow: 'hidden',
  background: 'rgba(42, 16, 14, 0.55)',
  border: '2px solid #d8a878',
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'flex-end',
});

export const getCliffBridgePowerFillSx = (power: number, charging: boolean) => ({
  width: '100%',
  height: `${Math.round(Math.min(1, Math.max(0, power)) * 100)}%`,
  background: charging
    ? 'linear-gradient(180deg, #ffe08a 0%, #d4782a 100%)'
    : 'linear-gradient(180deg, #f6d59a 0%, #b86a2c 100%)',
  boxShadow: '0 0 10px rgba(255, 200, 90, 0.45)',
  transition: charging ? 'none' : 'height 0.2s ease',
});

export type CliffCharacterMotion = 'enter' | 'idle' | 'leave';

export const CLIFF_CHAR_ENTER_MS = 1150;
export const CLIFF_CHAR_LEAVE_MS = 900;
export const CLIFF_CHAR_RECENTER_MS = 720;

export const CLIFF_CHAR_COMPACT_MAX_WIDTH = { xs: 124, sm: 140, md: 176, lg: 208 };

export const getCliffCharacterSlotSx = (left: string, ready: boolean) => ({
  position: 'absolute' as const,
  left,
  bottom: 0,
  width: { xs: '32%', sm: '26%', md: '28%' },
  overflow: 'visible' as const,
  transition: ready
    ? `left ${CLIFF_CHAR_RECENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : 'none',
});

export const getCliffCharacterWrapSx = (
  motion: CliffCharacterMotion,
  from: 'left' | 'right',
  compact: boolean
) => {
  const traveling = motion === 'enter' || motion === 'leave';
  const enterName = from === 'left' ? 'cliffCharEnterLeft' : 'cliffCharEnterRight';
  const leaveName = from === 'left' ? 'cliffCharLeaveLeft' : 'cliffCharLeaveRight';

  return {
    position: 'relative' as const,
    width: '100%',
    maxWidth: compact ? CLIFF_CHAR_COMPACT_MAX_WIDTH : 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    transformOrigin: 'center bottom',
    animation:
      motion === 'enter'
        ? `${enterName} ${CLIFF_CHAR_ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both`
        : motion === 'leave'
          ? `${leaveName} ${CLIFF_CHAR_LEAVE_MS}ms cubic-bezier(0.45, 0.05, 0.7, 0.2) both`
          : undefined,
    willChange: traveling ? 'transform, opacity' : undefined,
    '@keyframes cliffCharEnterLeft': {
      '0%': { transform: 'translateX(-90%) scale(0.84)', opacity: 0 },
      '58%': { opacity: 1 },
      '76%': { transform: 'translateX(6%) scale(1.05)' },
      '100%': { transform: 'translateX(0) scale(1)', opacity: 1 },
    },
    '@keyframes cliffCharEnterRight': {
      '0%': { transform: 'translateX(90%) scale(0.84)', opacity: 0 },
      '58%': { opacity: 1 },
      '76%': { transform: 'translateX(-6%) scale(1.05)' },
      '100%': { transform: 'translateX(0) scale(1)', opacity: 1 },
    },
    '@keyframes cliffCharLeaveLeft': {
      '0%': { transform: 'translateX(0) scale(1)', opacity: 1 },
      '22%': { transform: 'translateX(8%) scale(1.04)', opacity: 1 },
      '100%': { transform: 'translateX(-95%) scale(0.86)', opacity: 0 },
    },
    '@keyframes cliffCharLeaveRight': {
      '0%': { transform: 'translateX(0) scale(1)', opacity: 1 },
      '22%': { transform: 'translateX(-8%) scale(1.04)', opacity: 1 },
      '100%': { transform: 'translateX(95%) scale(0.86)', opacity: 0 },
    },
  };
};

export const CLIFF_LIFT_RISE_MS = 2400;

export const getCliffLiftStageSx = (raised: boolean, animate: boolean) => ({
  ...getCliffHubStageSx(),
  transform: raised ? 'translateY(-16%)' : 'translateY(0)',
  transition: animate ? `transform ${CLIFF_LIFT_RISE_MS}ms cubic-bezier(0.22, 0.72, 0.28, 1)` : 'none',
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
});

export const getCliffLiftPetSx = (index: number, arriving: boolean) => ({
  position: 'absolute' as const,
  left: index === 0 ? '23%' : '33%',
  top: '57%',
  width: '14%',
  zIndex: 3,
  pointerEvents: 'none' as const,
  animation: arriving ? `cliffLiftPetArrive ${CLIFF_CHAR_ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both` : undefined,
  '@keyframes cliffLiftPetArrive': {
    '0%': { transform: 'translateY(28%) scale(0.72)', opacity: 0 },
    '100%': { transform: 'translateY(0) scale(1)', opacity: 1 },
  },
  borderRadius: '22%',
  '& img': {
    width: '100%',
    height: 'auto',
    display: 'block',
    borderRadius: '22%',
    boxShadow: '0 10px 18px rgba(40, 16, 24, 0.48), 0 3px 6px rgba(40, 16, 24, 0.28)',
  },
});

export const CLIFF_ROPE_SWING_MS = 1600;
export const CLIFF_ROPE_JUMP_MS = 720;
export const CLIFF_ROPE_FALL_MS = 900;
export const CLIFF_ROPE_QTE_PERIOD_MS = 1680;
export const CLIFF_ROPE_QTE_TARGET_DEG = 52;
export const CLIFF_ROPE_QTE_TARGET_MIN_DEG = 22;

export const getCliffRopeHangSx = (swinging: boolean) => ({
  position: 'relative' as const,
  transformOrigin: 'top center',
  animation: swinging
    ? `cliffRopePendulum ${CLIFF_ROPE_SWING_MS}ms ease-in-out infinite`
    : undefined,
  '@keyframes cliffRopePendulum': {
    '0%, 100%': { transform: 'rotate(-26deg)' },
    '50%': { transform: 'rotate(26deg)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: swinging ? `cliffRopePendulum ${CLIFF_ROPE_SWING_MS * 2}ms linear infinite` : 'none',
  },
});

export const getCliffRopeRiderSx = (slot: 'solo' | 'left' | 'right' = 'solo') => ({
  position: 'absolute' as const,
  left: slot === 'left' ? '34%' : slot === 'right' ? '66%' : '50%',
  bottom: '8%',
  width: '170%',
  transform: 'translateX(-50%)',
  pointerEvents: 'none' as const,
  zIndex: 1,
});

export const getCliffRopeJumpSx = (fromCenter: string, toCenter: string) => ({
  position: 'absolute' as const,
  left: fromCenter,
  bottom: '40%',
  width: { xs: '32%', sm: '26%', md: '28%' },
  zIndex: 5,
  pointerEvents: 'none' as const,
  transform: 'translateX(-50%)',
  animation: `cliffRopeJump ${CLIFF_ROPE_JUMP_MS}ms cubic-bezier(0.22, 0.72, 0.28, 1) both`,
  '@keyframes cliffRopeJump': {
    '0%': { left: fromCenter, transform: 'translateX(-50%) translateY(0) scale(1)', opacity: 1 },
    '42%': { transform: 'translateX(-50%) translateY(-38%) scale(1)', opacity: 1 },
    '100%': { left: toCenter, transform: 'translateX(-50%) translateY(0) scale(1)', opacity: 1 },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: `cliffRopeJump ${CLIFF_ROPE_JUMP_MS}ms linear both`,
    '@keyframes cliffRopeJump': {
      from: { left: fromCenter, transform: 'translateX(-50%)', opacity: 1 },
      to: { left: toCenter, transform: 'translateX(-50%)', opacity: 1 },
    },
  },
});

export const getCliffRopeFallSx = (fromCenter: string) => ({
  position: 'absolute' as const,
  left: fromCenter,
  bottom: '40%',
  width: { xs: '32%', sm: '26%', md: '28%' },
  zIndex: 5,
  pointerEvents: 'none' as const,
  transform: 'translateX(-50%)',
  animation: `cliffRopeFall ${CLIFF_ROPE_FALL_MS}ms cubic-bezier(0.55, 0.06, 0.85, 0.2) both`,
  '@keyframes cliffRopeFall': {
    '0%': { transform: 'translateX(-50%) translateY(0) rotate(0deg)', opacity: 1 },
    '100%': { transform: 'translateX(-50%) translateY(140%) rotate(18deg)', opacity: 0 },
  },
  '@media (prefers-reduced-motion: reduce)': {
    animation: `cliffRopeFall ${CLIFF_ROPE_FALL_MS}ms linear both`,
    '@keyframes cliffRopeFall': {
      from: { opacity: 1, transform: 'translateX(-50%)' },
      to: { opacity: 0, transform: 'translateX(-50%) translateY(40%)' },
    },
  },
});

export const getCliffRopeQteWrapSx = () => ({
  position: 'absolute' as const,
  left: '50%',
  top: '64%',
  zIndex: 7,
  width: 'min(44%, 176px)',
  aspectRatio: '1 / 1',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'auto' as const,
  borderRadius: '50%',
  background: 'radial-gradient(circle at 42% 36%, #fff6e8 0%, #f0d2ae 62%, #d7ae7e 100%)',
  border: '2px solid #8b4a2b',
  boxShadow:
    '0 12px 22px rgba(40, 16, 12, 0.42), inset 0 1px 0 rgba(255, 248, 238, 0.7), inset 0 -8px 12px rgba(92, 38, 24, 0.12)',
});

export const getCliffLiftPetPickSx = (selected: boolean) => ({
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: 0.5,
  p: 0.75,
  borderRadius: 2,
  border: selected ? '2px solid #c47a2c' : '2px solid rgba(139, 74, 43, 0.28)',
  bgcolor: selected ? 'rgba(255, 232, 196, 0.9)' : '#fff8ee',
  cursor: 'pointer',
  minWidth: 0,
  '& img': {
    width: 64,
    height: 64,
    objectFit: 'contain' as const,
    borderRadius: '22%',
    boxShadow: '0 6px 12px rgba(40, 16, 24, 0.28)',
  },
});

import { alpha, Theme, keyframes } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../../theme/surfaceStyles';

export const DATING_IDEAS_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.85);

const getSurfaceBorder = (theme: Theme) =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? 0.14 : 0.22
  )}`;

export const getDatingIdeasSectionSx = (theme: Theme) => ({
  px: 2.75,
  py: 2.25,
  mb: 3,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  width: '100%',
  cursor: 'pointer',
  border: getSurfaceBorder(theme),
  transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  ...getPrimaryTintSurface(theme, { interactive: true }),
  '&:hover': {
    transform: 'translateY(-2px)',
  },
});

export const sparklePulse = keyframes`
  0% { transform: scale(0.92); opacity: 0.55; }
  50% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(0.92); opacity: 0.55; }
`;

export const cardReveal = keyframes`
  0% { opacity: 0; transform: translateY(18px) scale(0.94); filter: blur(6px); }
  60% { opacity: 1; filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
`;

export const shuffleGlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const getDatingIdeasPageRootSx = (theme: Theme) => ({
  py: 2,
  pb: { xs: 12, sm: 4 },
  minHeight: '70vh',
  background: `radial-gradient(120% 80% at 50% -10%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.16 : 0.28)} 0%, transparent 55%)`,
});

export const getIdeaCardSx = (theme: Theme, flipped: boolean) => ({
  position: 'relative' as const,
  width: '100%',
  maxWidth: 420,
  mx: 'auto',
  perspective: 1200,
  '& .idea-card-inner': {
    position: 'relative' as const,
    width: '100%',
    minHeight: 320,
    transformStyle: 'preserve-3d',
    transition: 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1)',
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  },
  '& .idea-card-face': {
    position: 'relative' as const,
    backfaceVisibility: 'hidden' as const,
    borderRadius: `${SURFACE_BORDER_RADIUS}px`,
    border: getSurfaceBorder(theme),
    p: 3,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    overflow: 'hidden' as const,
    boxSizing: 'border-box' as const,
    ...getPrimaryTintSurface(theme, {
      tint: { light: 0.14, dark: 0.26 },
    }),
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 16px 40px ${alpha(theme.palette.common.black, 0.08)}`
        : `0 18px 48px ${alpha(theme.palette.common.black, 0.4)}`,
  },
  '& .idea-card-back': {
    position: 'absolute' as const,
    inset: 0,
    transform: 'rotateY(180deg)',
  },
});

export const getCompletedEventPreviewSx = (theme: Theme) => ({
  mt: 2,
  maxWidth: 420,
  mx: 'auto',
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  overflow: 'hidden' as const,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.2 },
  }),
});

export const getHistoryCardSx = (theme: Theme, status: 'completed' | 'skipped') => ({
  minWidth: 220,
  maxWidth: 260,
  p: 2,
  borderRadius: `${DATING_IDEAS_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  scrollSnapAlign: 'start' as const,
  ...getPrimaryTintSurface(theme, {
    tint: {
      light: status === 'completed' ? 0.16 : 0.08,
      dark: status === 'completed' ? 0.28 : 0.16,
    },
  }),
  opacity: status === 'skipped' ? 0.78 : 1,
});

export const getGenerateOfferSx = (theme: Theme) => ({
  p: { xs: 3, sm: 4 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  textAlign: 'center' as const,
  maxWidth: 480,
  mx: 'auto',
  animation: `${cardReveal} 520ms ease both`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.14, dark: 0.24 },
  }),
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
});

export const getGeneratingSx = (theme: Theme) => ({
  p: 4,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  textAlign: 'center' as const,
  maxWidth: 420,
  mx: 'auto',
  minHeight: 280,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  background: `linear-gradient(120deg, ${alpha(theme.palette.primary.light, 0.35)}, ${alpha(theme.palette.primary.main, 0.22)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
  backgroundSize: '200% 200%',
  animation: `${shuffleGlow} 2.2s ease infinite`,
});

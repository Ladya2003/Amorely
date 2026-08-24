import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS } from '../../theme/surfaceStyles';

const getSurfaceBorder = (theme: Theme) =>
  `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.22)}`;

export const getLegalArticleSx = () => ({
  maxWidth: 760,
  mx: 'auto',
  width: '100%',
});

export const getLegalCardSx = (theme: Theme) => ({
  p: { xs: 2.5, sm: 3.5 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.92 : 0.72),
});

export const getSupportCardSx = (theme: Theme) => ({
  ...getLegalCardSx(theme),
  maxWidth: 480,
  mx: 'auto',
  textAlign: 'center' as const,
});

export const getSupportIconWrapSx = (theme: Theme) => ({
  width: 64,
  height: 64,
  mx: 'auto',
  mb: 1.5,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.common.white,
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
});

export const getBlogToolbarSx = () => ({
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' } as const,
  gap: 1.5,
  alignItems: { sm: 'center' },
  mb: 3,
});

export const getBlogGridSx = () => ({
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
  gap: 2,
});

export const getBlogCardSx = (theme: Theme) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  overflow: 'hidden',
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.94 : 0.7),
  textDecoration: 'none',
  color: 'inherit',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow:
      theme.palette.mode === 'light'
        ? `0 12px 28px ${alpha(theme.palette.common.black, 0.08)}`
        : `0 12px 28px ${alpha(theme.palette.common.black, 0.35)}`,
  },
});

export const getBlogCardImageSx = () => ({
  width: '100%',
  height: 168,
  objectFit: 'cover' as const,
  objectPosition: 'top',
  display: 'block',
  bgcolor: 'action.hover',
});

export const getFooterLinksSx = () => ({
  display: 'flex',
  flexWrap: 'wrap' as const,
  justifyContent: 'center',
  gap: { xs: 1.25, sm: 2 },
  mb: 1.5,
});

export const getFooterLinkSx = (theme: Theme) => ({
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'text.secondary',
  textDecoration: 'none',
  transition: theme.transitions.create('color', {
    duration: 360,
    easing: theme.transitions.easing.easeOut,
  }),
  '&:hover': {
    color: theme.palette.primary.main,
  },
});

export const getFooterContactSx = () => ({
  fontSize: '0.8125rem',
  color: 'text.secondary',
  lineHeight: 1.45,
  mb: 1.5,
});

export const getBlogHeroImageSx = (theme: Theme) => ({
  width: '100%',
  maxHeight: 420,
  objectFit: 'cover' as const,
  objectPosition: 'top',
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  mb: 3,
});

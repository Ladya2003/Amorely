import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../../theme/surfaceStyles';

export const getResultQuestionCardSx = (theme: Theme) => ({
  p: 2.25,
  mb: 2,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.85)}px`,
  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.18 : 0.28)}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 8px 28px ${alpha(theme.palette.primary.main, 0.1)}`
      : `0 10px 32px ${alpha(theme.palette.common.black, 0.28)}`,
  ...getPrimaryTintSurface(theme, { tint: { light: 0.06, dark: 0.12 } }),
});

export const getResultQuestionTitleSx = (theme: Theme) => ({
  fontWeight: 700,
  fontSize: '1rem',
  lineHeight: 1.45,
  color: theme.palette.mode === 'light' ? '#3b0051' : theme.palette.primary.light,
  mb: 2,
});

export const getResultAnswerRowSx = (align: 'left' | 'right') => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 1,
  mb: 1.25,
  flexDirection: align === 'right' ? 'row-reverse' : 'row',
  justifyContent: align === 'right' ? 'flex-start' : 'flex-start',
});

export const getResultAnswerBubbleSx = (theme: Theme, align: 'left' | 'right') => ({
  px: 2,
  py: 1.25,
  maxWidth: '78%',
  borderRadius: '999px',
  bgcolor:
    theme.palette.mode === 'light'
      ? alpha(theme.palette.common.black, 0.06)
      : alpha(theme.palette.common.white, 0.1),
  color: theme.palette.text.primary,
  fontSize: '0.9375rem',
  lineHeight: 1.4,
  textAlign: align === 'right' ? 'right' : 'left',
});

export const getResultAvatarSx = () => ({
  width: 36,
  height: 36,
  fontSize: '0.875rem',
  flexShrink: 0,
});

export const getResultImagePairSx = () => ({
  display: 'flex',
  gap: 1.5,
  mt: 0.5,
});

export const getResultImageCardSx = (theme: Theme) => ({
  flex: 1,
  minWidth: 0,
  position: 'relative' as const,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.75)}px`,
  overflow: 'visible' as const,
  pb: 2.5,
});

export const getResultImagePhotoSx = () => ({
  width: '100%',
  height: 148,
  objectFit: 'cover' as const,
  display: 'block',
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.75)}px`,
});

export const getResultImageAvatarWrapSx = () => ({
  position: 'absolute' as const,
  left: '50%',
  bottom: 0,
  transform: 'translate(-50%, 0)',
  zIndex: 1,
});

export const getResultImageAvatarSx = (theme: Theme) => ({
  width: 40,
  height: 40,
  border: `3px solid ${theme.palette.background.paper}`,
  boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.18)}`,
});

export const getResultImagePlaceholderSx = (theme: Theme) => ({
  width: '100%',
  height: 148,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.75)}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
  color: theme.palette.text.secondary,
  fontSize: '0.8125rem',
  textAlign: 'center' as const,
  px: 1.5,
});

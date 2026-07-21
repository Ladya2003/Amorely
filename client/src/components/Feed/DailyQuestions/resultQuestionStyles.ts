import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS } from '../../../theme/surfaceStyles';

/** Непрозрачная поверхность карточки — не смешивается с фиолетовым glass-модалом */
const getResultCardBackground = (theme: Theme) =>
  theme.palette.mode === 'light' ? theme.palette.common.white : '#242424';

export const getResultQuestionCardSx = (theme: Theme) => ({
  p: 2.25,
  mb: 2,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.85)}px`,
  bgcolor: getResultCardBackground(theme),
  color: theme.palette.text.primary,
  border: `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? 0.2 : 0.32
  )}`,
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 8px 28px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 10px 32px ${alpha(theme.palette.common.black, 0.35)}`,
});

export const getResultQuestionTitleSx = (theme: Theme) => ({
  fontWeight: 700,
  fontSize: '1rem',
  lineHeight: 1.45,
  color: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.95)',
  mb: 2,
  pr: 4,
});

export const getResultAnswerRowSx = (align: 'left' | 'right') => ({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 1,
  mb: 1.25,
  flexDirection: align === 'right' ? 'row-reverse' : 'row',
  justifyContent: align === 'right' ? 'flex-start' : 'flex-start',
});

export const getResultAnswerBubbleSx = (theme: Theme, align: 'left' | 'right') => {
  const isLight = theme.palette.mode === 'light';

  return {
    display: 'inline-block',
    px: 2,
    py: 1.25,
    maxWidth: '78%',
    borderRadius: '20px',
    bgcolor: isLight ? '#f0f0f0' : 'rgba(255, 255, 255, 0.16)',
    border: `1px solid ${alpha(
      theme.palette.common.black,
      isLight ? 0.08 : 0.12
    )}`,
    color: isLight ? 'rgba(0, 0, 0, 0.87)' : 'rgba(255, 255, 255, 0.95)',
    fontSize: '0.9375rem',
    lineHeight: 1.45,
    fontWeight: 500,
    textAlign: align === 'right' ? 'right' : 'left',
    wordBreak: 'break-word' as const,
  };
};

export const getResultMutedTextSx = (theme: Theme) => ({
  color: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.65)',
  fontStyle: 'italic' as const,
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
  bgcolor: theme.palette.mode === 'light' ? theme.palette.grey[100] : alpha(theme.palette.common.white, 0.1),
  border: `1px dashed ${alpha(theme.palette.text.secondary, 0.45)}`,
  color: theme.palette.text.secondary,
  fontSize: '0.8125rem',
  textAlign: 'center' as const,
  px: 1.5,
});

export const getResultEditButtonSx = (theme: Theme) => {
  const isLight = theme.palette.mode === 'light';
  const iconColor = isLight ? 'rgba(0, 0, 0, 0.72)' : theme.palette.text.primary;

  return {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    zIndex: 2,
    bgcolor: isLight ? theme.palette.common.white : theme.palette.background.paper,
    border: `1px solid ${alpha(
      isLight ? theme.palette.common.black : theme.palette.divider,
      isLight ? 0.14 : 0.8
    )}`,
    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, isLight ? 0.12 : 0.12)}`,
    color: `${iconColor} !important`,
    '& .MuiSvgIcon-root': {
      color: `${iconColor} !important`,
    },
    '&:hover': {
      bgcolor: isLight ? theme.palette.grey[100] : alpha(theme.palette.common.white, 0.1),
    },
  };
};

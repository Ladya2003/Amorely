import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../../../theme/surfaceStyles';

export const getDailyQuestionsPaperSx = (theme: Theme) => ({
  px: 2.75,
  py: 2,
  mb: 3,
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  width: '100%',
  ...getPrimaryTintSurface(theme),
});

export const getDailyQuestionsHeaderSx = () => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  mb: 2,
});

export const getDailyQuestionsCardsRowSx = () => ({
  display: 'flex',
  gap: 1.5,
  width: '100%',
});

export const getCategoryCardSx = (theme: Theme, interactive: boolean) => ({
  flex: '1 1 0',
  minWidth: 0,
  p: 2,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.85)}px`,
  textAlign: 'center' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.75,
  minHeight: 140,
  cursor: interactive ? 'pointer' : 'default',
  transition: 'transform 200ms ease, box-shadow 200ms ease',
  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.22)}`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.12, dark: 0.2 },
    interactive,
  }),
  ...(interactive && {
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  }),
});

export const getCategoryEmojiSx = () => ({
  fontSize: '2.25rem',
  lineHeight: 1,
});

export const getCategoryTimerSx = (theme: Theme) => ({
  fontSize: '0.7rem',
  fontWeight: 600,
  color: theme.palette.primary.main,
  mt: 0.25,
});

export const getQuestionProgressSx = (theme: Theme) => ({
  width: '100%',
  height: 4,
  borderRadius: 2,
  bgcolor: alpha(theme.palette.primary.main, 0.12),
  overflow: 'hidden',
  mb: 2,
});

export const getChoiceButtonSx = (theme: Theme, selected: boolean) => ({
  textTransform: 'none' as const,
  justifyContent: 'flex-start' as const,
  py: 1.25,
  px: 2,
  fontWeight: selected ? 600 : 500,
  ...(selected
    ? {}
    : {
        color: theme.palette.text.primary,
        borderColor: alpha(
          theme.palette.primary.main,
          theme.palette.mode === 'light' ? 0.4 : 0.55
        ),
        bgcolor: alpha(
          theme.palette.primary.main,
          theme.palette.mode === 'light' ? 0.08 : 0.18
        ),
        '&:hover': {
          bgcolor: alpha(
            theme.palette.primary.main,
            theme.palette.mode === 'light' ? 0.14 : 0.26
          ),
          borderColor: theme.palette.primary.main,
        },
      }),
});

export const getImageChoiceLabelSx = (theme: Theme) => ({
  color: theme.palette.text.primary,
  bgcolor: alpha(
    theme.palette.background.paper,
    theme.palette.mode === 'light' ? 0.92 : 0.72
  ),
});

export const getImageChoiceSx = (theme: Theme, selected: boolean) => ({
  flex: 1,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.6)}px`,
  overflow: 'hidden',
  cursor: 'pointer',
  border: selected
    ? `2px solid ${theme.palette.primary.main}`
    : `2px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.15 : 0.35)}`,
  transition: 'border-color 200ms ease, transform 200ms ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
  '& img': {
    width: '100%',
    height: 120,
    objectFit: 'cover' as const,
    display: 'block',
  },
});

export const getSimilarityRingSx = (theme: Theme, percent: number) => {
  const color =
    percent >= 75
      ? theme.palette.success.main
      : percent >= 50
        ? theme.palette.warning.main
        : theme.palette.error.main;

  return {
    width: 88,
    height: 88,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `4px solid ${color}`,
    fontWeight: 700,
    fontSize: '1.25rem',
    color,
    mx: 'auto',
    mb: 2,
  };
};

export const getResultItemSx = (theme: Theme, isMatch: boolean | null) => ({
  p: 1.5,
  mb: 1.5,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.6)}px`,
  border: `1px solid ${alpha(
    isMatch === true
      ? theme.palette.success.main
      : isMatch === false
        ? theme.palette.error.main
        : theme.palette.primary.main,
    0.2
  )}`,
  ...getPrimaryTintSurface(theme, { tint: { light: 0.08, dark: 0.14 } }),
});

export const getHistoryRoundSx = (theme: Theme) => ({
  p: 2,
  mb: 2,
  borderRadius: `${Math.round(SURFACE_BORDER_RADIUS * 0.75)}px`,
  ...getPrimaryTintSurface(theme, { tint: { light: 0.1, dark: 0.16 } }),
});

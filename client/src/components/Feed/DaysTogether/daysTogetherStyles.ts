import { alpha, Theme } from '@mui/material/styles';
import { SURFACE_BORDER_RADIUS, getPrimaryTintSurface } from '../feedBannerStyles';
import { ColorTheme } from './components/ColorPicker';

export const DAYS_TOGETHER_INNER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);

export const getDaysTogetherSignatureImageSx = (maxWidth: string | number = '100%') => ({
  maxWidth,
  maxHeight: 100,
  borderRadius: `${DAYS_TOGETHER_INNER_RADIUS}px`,
  objectFit: 'contain' as const,
  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))',
});
export const DAYS_TOGETHER_ACTION_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.5);

const getSurfaceBorder = (theme: Theme, strength: 'soft' | 'medium' = 'medium') =>
  `1px solid ${alpha(
    theme.palette.primary.main,
    theme.palette.mode === 'light' ? (strength === 'soft' ? 0.1 : 0.14) : strength === 'soft' ? 0.18 : 0.24
  )}`;

export const getDaysTogetherEmptySx = (theme: Theme) => ({
  p: { xs: 2.75, sm: 3 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  textAlign: 'center' as const,
  cursor: 'pointer',
  transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), background-color 220ms ease',
  ...getPrimaryTintSurface(theme, { interactive: true }),
  '&:hover': {
    transform: 'translateY(-2px)',
  },
});

export const getDaysTogetherCardSx = (theme: Theme) => ({
  p: { xs: 2.75, sm: 3 },
  borderRadius: `${SURFACE_BORDER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 10px 32px ${alpha(theme.palette.common.black, 0.06)}`
      : `0 12px 40px ${alpha(theme.palette.common.black, 0.34)}`,
  bgcolor: 'transparent',
  position: 'relative' as const,
  overflow: 'hidden' as const,
});

export const getDaysTogetherBackgroundPhotoSx = (url: string) => ({
  position: 'absolute' as const,
  inset: 0,
  backgroundImage: `url(${url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.34,
  transform: 'scale(1.04)',
  zIndex: 0,
});

export const getDaysTogetherBackgroundGradientSx = (theme: Theme, colorTheme: ColorTheme) => ({
  position: 'absolute' as const,
  inset: 0,
  background: `linear-gradient(165deg, ${alpha(colorTheme.preview, theme.palette.mode === 'light' ? 0.24 : 0.34)} 0%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.22)} 42%, ${alpha(theme.palette.background.default, theme.palette.mode === 'light' ? 0.92 : 0.94)} 100%)`,
  zIndex: 1,
});

export const getDaysTogetherHeroPanelSx = (theme: Theme) => ({
  mb: 2,
  px: { xs: 2, sm: 2.5 },
  py: { xs: 2.25, sm: 2.5 },
  borderRadius: `${DAYS_TOGETHER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  textAlign: 'center' as const,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.15, dark: 0.28 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
});

export const getDaysTogetherInnerSurfaceSx = (theme: Theme) => ({
  p: 2,
  borderRadius: `${DAYS_TOGETHER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.1, dark: 0.2 },
  }),
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
});

export const getDaysTogetherActionsRowSx = (theme: Theme) => ({
  mt: 3,
  p: 1,
  borderRadius: `${DAYS_TOGETHER_INNER_RADIUS}px`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 1,
  flexWrap: 'wrap' as const,
  border: getSurfaceBorder(theme, 'soft'),
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.08, dark: 0.16 },
  }),
});

export const getDaysTogetherActionButtonSx = (theme: Theme, colorTheme: ColorTheme) => ({
  width: 44,
  height: 44,
  borderRadius: `${DAYS_TOGETHER_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  bgcolor: alpha(colorTheme.preview, theme.palette.mode === 'light' ? 0.1 : 0.18),
  color: colorTheme.preview,
  transition: 'background-color 220ms ease, transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
  '&:hover': {
    bgcolor: alpha(colorTheme.preview, theme.palette.mode === 'light' ? 0.18 : 0.28),
    transform: 'scale(1.05)',
  },
});

export const getDaysTogetherChipSx = (theme: Theme, colorTheme: ColorTheme) => ({
  borderRadius: `${DAYS_TOGETHER_ACTION_RADIUS}px`,
  borderColor: alpha(colorTheme.preview, 0.45),
  color: colorTheme.preview,
  bgcolor: alpha(colorTheme.preview, theme.palette.mode === 'light' ? 0.08 : 0.14),
  fontWeight: 600,
  '& .MuiChip-label': {
    px: 1.25,
  },
});

export const getDaysTogetherProgressSx = (theme: Theme, colorTheme: ColorTheme) => ({
  height: 10,
  borderRadius: 999,
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.2),
  '& .MuiLinearProgress-bar': {
    borderRadius: 999,
    background: `linear-gradient(90deg, ${colorTheme.preview} 0%, ${theme.palette.primary.main} 100%)`,
  },
});

export const getDaysTogetherAchievementItemSx = (theme: Theme, colorTheme: ColorTheme) => ({
  p: 1.5,
  borderRadius: `${DAYS_TOGETHER_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  bgcolor: alpha(colorTheme.preview, theme.palette.mode === 'light' ? 0.07 : 0.12),
  textAlign: 'center' as const,
  transition: 'transform 220ms ease, background-color 220ms ease',
  '&:hover': {
    transform: 'scale(1.04)',
    bgcolor: alpha(colorTheme.preview, theme.palette.mode === 'light' ? 0.12 : 0.2),
  },
});

export const getColorPickerPopoverPaperSx = (theme: Theme) => ({
  mt: 1,
  borderRadius: `${DAYS_TOGETHER_INNER_RADIUS}px`,
  border: getSurfaceBorder(theme),
  overflow: 'hidden',
  boxShadow:
    theme.palette.mode === 'light'
      ? `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}`
      : `0 20px 56px ${alpha(theme.palette.common.black, 0.42)}`,
  ...getPrimaryTintSurface(theme, {
    tint: { light: 0.14, dark: 0.24 },
  }),
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
});

export const getColorPickerTitleSx = () => ({
  fontWeight: 700,
  fontSize: '0.9375rem',
  letterSpacing: '-0.01em',
  mb: 0.25,
});

export const getColorPickerGridSx = () => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 1.25,
  mt: 1.25,
  maxHeight: 300,
  overflowY: 'auto' as const,
  pr: 0.25,
  scrollbarWidth: 'thin' as const,
});

const getColorPickerSwatchBaseSx = (theme: Theme, selected: boolean) => ({
  width: 44,
  height: 44,
  borderRadius: `${DAYS_TOGETHER_ACTION_RADIUS}px`,
  cursor: 'pointer',
  border: selected
    ? `2px solid ${theme.palette.primary.main}`
    : getSurfaceBorder(theme, 'soft'),
  boxShadow: selected
    ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.28)}`
    : theme.palette.mode === 'light'
      ? `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
      : `0 6px 16px ${alpha(theme.palette.common.black, 0.24)}`,
  transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
  '&:hover': {
    transform: 'scale(1.06)',
    boxShadow: selected
      ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.36)}`
      : theme.palette.mode === 'light'
        ? `0 8px 20px ${alpha(theme.palette.common.black, 0.12)}`
        : `0 10px 24px ${alpha(theme.palette.common.black, 0.32)}`,
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
});

export const getColorPickerThemeSwatchSx = (theme: Theme, selected: boolean) =>
  getColorPickerSwatchBaseSx(theme, selected);

export const getColorPickerCustomSwatchSx = (theme: Theme, selected: boolean) => ({
  ...getColorPickerSwatchBaseSx(theme, selected),
  borderStyle: selected ? 'solid' : 'dashed',
  borderColor: selected ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.28),
});

export const getColorPickerBackButtonSx = (theme: Theme) => ({
  mb: 1.25,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 600,
  fontSize: '0.8125rem',
  px: 1.5,
  py: 0.625,
  color: 'text.primary',
  border: getSurfaceBorder(theme, 'soft'),
  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.16),
  '&:hover': {
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.14 : 0.24),
    borderColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.22 : 0.32),
  },
});

export const getColorPickerHexWrapSx = (theme: Theme) => ({
  p: 1.25,
  borderRadius: `${DAYS_TOGETHER_ACTION_RADIUS}px`,
  border: getSurfaceBorder(theme, 'soft'),
  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.72 : 0.42),
  '& .react-colorful': {
    width: '100% !important',
    height: 180,
    borderRadius: `${Math.round(DAYS_TOGETHER_ACTION_RADIUS * 0.75)}px`,
  },
});

export const getColorPickerHexCaptionSx = () => ({
  mt: 1.25,
  display: 'block',
  textAlign: 'center' as const,
  fontSize: '0.8125rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'text.secondary',
});

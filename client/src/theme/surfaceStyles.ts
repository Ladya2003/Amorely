import { alpha, Theme } from '@mui/material/styles';

/** Скругление поверхностей ленты, модалок и primary-кнопок */
export const SURFACE_BORDER_RADIUS = 32;

/** Непрозрачный аналог tint-фона — для маски floating-лейбла на обводке инпута */
export const getPrimaryTintLabelNotchBg = (theme: Theme, tintAlpha: number) =>
  `color-mix(in srgb, ${theme.palette.primary.main} ${Math.round(tintAlpha * 100)}%, ${theme.palette.background.default})`;

export const getPrimaryTintSurface = (
  theme: Theme,
  options?: {
    interactive?: boolean;
    tint?: { light: number; dark: number };
    hover?: { light: number; dark: number };
    /** Маска shrink-лейбла под цвет этой поверхности (по умолчанию вкл.) */
    labelNotch?: boolean;
  }
) => {
  const tintAlpha =
    theme.palette.mode === 'light'
      ? (options?.tint?.light ?? 0.11)
      : (options?.tint?.dark ?? 0.2);
  const hoverAlpha =
    theme.palette.mode === 'light'
      ? (options?.hover?.light ?? 0.17)
      : (options?.hover?.dark ?? 0.28);
  const withLabelNotch = options?.labelNotch !== false;

  return {
    bgcolor: alpha(theme.palette.primary.main, tintAlpha),
    ...(withLabelNotch && {
      '& .MuiInputLabel-root.MuiInputLabel-shrink, & .MuiFormLabel-root.MuiInputLabel-shrink': {
        bgcolor: `${getPrimaryTintLabelNotchBg(theme, tintAlpha)} !important`,
        px: 0.75,
        ml: -0.75,
        zIndex: 1,
      },
    }),
    ...(options?.interactive && {
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, hoverAlpha),
      },
    }),
  };
};

import { alpha, Theme } from '@mui/material/styles';

/** Скругление поверхностей ленты, модалок и primary-кнопок */
export const SURFACE_BORDER_RADIUS = 32;

export const getPrimaryTintSurface = (
  theme: Theme,
  options?: {
    interactive?: boolean;
    tint?: { light: number; dark: number };
    hover?: { light: number; dark: number };
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

  return {
    bgcolor: alpha(theme.palette.primary.main, tintAlpha),
    ...(options?.interactive && {
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, hoverAlpha),
      },
    }),
  };
};

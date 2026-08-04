import { alpha, Theme } from '@mui/material/styles';
import { APP_FONT_FAMILY } from './fonts';

/** Скругление поверхностей ленты, модалок и primary-кнопок */
export const SURFACE_BORDER_RADIUS = 32;

/**
 * TEMP: скрыть floating label у TextField / Textarea / DatePicker,
 * чтобы оценить вид без лейбла и «прямоугольника» на обводке.
 * Вернуть false, когда закончите смотреть.
 */
export const HIDE_INPUT_LABELS = true;

const AUTOFILL_FONT = {
  fontSize: '1rem !important',
  lineHeight: '1.4375em !important',
  fontFamily: `${APP_FONT_FAMILY} !important`,
  letterSpacing: '-0.01em !important',
} as const;

/** Chrome autofill: прозрачный фон; шрифт через ::first-line — иначе до фокуса меньше */
export const getWebkitAutofillInputSx = (theme: Theme) => ({
  WebkitBoxShadow: '0 0 0px 1000px transparent inset !important',
  WebkitTextFillColor: `${theme.palette.text.primary} !important`,
  caretColor: theme.palette.text.primary,
  backgroundColor: 'transparent !important',
  ...AUTOFILL_FONT,
  transition: 'background-color 99999s ease-out 0s',
  // Chrome рисует текст autofill через first-line — без этого font-size игнорируется
  '&::first-line': {
    ...AUTOFILL_FONT,
  },
});

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

import { createTheme, PaletteMode, alpha, Theme } from '@mui/material/styles';
import '@mui/x-date-pickers/themeAugmentation';
import { APP_FONT_FAMILY, typographyScale } from './fonts';
import {
  getAppModalActionsSx,
  getAppModalBackdropSx,
  getAppModalContentSx,
  getAppModalDialogPaperSx,
  getAppModalTitleSx,
  MODAL_TEXT_PRIMARY_LIGHT,
} from './modalStyles';
import { getWebkitAutofillInputSx, HIDE_INPUT_LABELS, SURFACE_BORDER_RADIUS } from './surfaceStyles';
import { getAppAlertStyles } from './alertStyles';

export { SURFACE_BORDER_RADIUS } from './surfaceStyles';
export { getAppAlertSx, getAppAlertStyles } from './alertStyles';

/** Скругление полей ввода — чуть меньше карточек, в той же шкале */
export const INPUT_BORDER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);

/** Горизонтальный padding текста в medium/small outlined-полях */
const INPUT_PADDING_X = 20;
const INPUT_PADDING_X_SMALL = 16;

/**
 * Shrink-лейбл должен сидеть правее дуги border-radius, иначе верхняя обводка
 * проходит через начало текста (MUI по умолчанию translateX=14px).
 */
const INPUT_LABEL_SHRINK_X = INPUT_BORDER_RADIUS + 2;

/**
 * Padding fieldset оставляем компактным (как у MUI), чтобы notch начинался раньше
 * и вырезал верхнюю обводку до дуги; лейбл при этом сидит правее (INPUT_LABEL_SHRINK_X).
 */
const NOTCHED_OUTLINE_PADDING_X = 8;
const NOTCH_LEGEND_SPAN_PADDING_X = 10;

const notchedOutlineLegendStyles = {
  transition: 'none',
  '& > span': {
    paddingLeft: NOTCH_LEGEND_SPAN_PADDING_X,
    paddingRight: NOTCH_LEGEND_SPAN_PADDING_X,
  },
} as const;

/** Закрытый notch: убираем padding у legend/span — иначе Safari вырезает дыру в верхней границе */
const closedNotchedOutlineLegendStyles = {
  transition: 'none',
  maxWidth: '0.01px !important',
  padding: 0,
  '& > span': {
    paddingLeft: 0,
    paddingRight: 0,
  },
} as const;

const getNotchedOutlineSlotStyles = (notched?: boolean) => ({
  // overflow:hidden + большой radius ломает вырез legend в Chromium
  overflow: 'visible' as const,
  padding: `0 ${NOTCHED_OUTLINE_PADDING_X}px`,
  // Без видимого label notch всегда закрыт — иначе дыра в верхней границе
  legend:
    HIDE_INPUT_LABELS || !notched
      ? closedNotchedOutlineLegendStyles
      : notchedOutlineLegendStyles,
});

/** Smooth hover/focus outline — MUI snaps border-color by default */
const OUTLINED_INPUT_OUTLINE_TRANSITION =
  'border-color 220ms cubic-bezier(0.4, 0, 0.2, 1), border-width 180ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1)';

const outlinedInputRootStyles = {
  borderRadius: INPUT_BORDER_RADIUS,
  transition: 'background-color 220ms cubic-bezier(0.4, 0, 0.2, 1)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: `${INPUT_BORDER_RADIUS}px`,
    transition: OUTLINED_INPUT_OUTLINE_TRANSITION,
  },
  '& .MuiInputBase-input:not(.MuiInputBase-inputMultiline)': {
    paddingLeft: INPUT_PADDING_X,
    paddingRight: INPUT_PADDING_X,
  },
  '& .MuiInputBase-inputSizeSmall:not(.MuiInputBase-inputMultiline)': {
    paddingLeft: INPUT_PADDING_X_SMALL,
    paddingRight: INPUT_PADDING_X_SMALL,
  },
  '&.MuiOutlinedInput-multiline': {
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  '&.MuiOutlinedInput-multiline .MuiInputBase-inputMultiline': {
    paddingLeft: '0 !important',
    paddingRight: '0 !important',
  },
  '&.MuiOutlinedInput-adornedStart': {
    paddingLeft: '10px',
  },
  '&.MuiOutlinedInput-adornedStart.MuiInputBase-sizeSmall': {
    paddingLeft: '10px',
  },
  '&.MuiOutlinedInput-adornedStart .MuiInputBase-input:not(.MuiInputBase-inputMultiline)': {
    paddingLeft: '0 !important',
  },
  '&.MuiOutlinedInput-adornedEnd': {
    paddingRight: '10px',
  },
  '&.MuiOutlinedInput-adornedEnd.MuiInputBase-sizeSmall': {
    paddingRight: '10px',
  },
  '&.MuiOutlinedInput-adornedEnd .MuiInputBase-input:not(.MuiInputBase-inputMultiline)': {
    paddingRight: '0 !important',
  },
} as const;

/** Autocomplete: MUI добавляет padding: 9 на OutlinedInput-root — убираем, выравниваем с TextField */
const getAutocompleteInputRootStyles = (ownerState: {
  hasPopupIcon?: boolean;
  hasClearIcon?: boolean;
  multiple?: boolean;
}) => {
  const iconPadding = (ownerState.hasPopupIcon ? 30 : 0) + (ownerState.hasClearIcon ? 26 : 0);

  return {
    borderRadius: INPUT_BORDER_RADIUS,
    transition: 'background-color 220ms cubic-bezier(0.4, 0, 0.2, 1)',
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: `${INPUT_BORDER_RADIUS}px`,
      transition: OUTLINED_INPUT_OUTLINE_TRANSITION,
    },
    padding: '0 !important',
    ...(iconPadding > 0 ? { paddingRight: `${iconPadding}px !important` } : {}),
    ...(ownerState.multiple
      ? {
          paddingTop: '6px !important',
          paddingBottom: '6px !important',
          flexWrap: 'wrap' as const,
          '& .MuiAutocomplete-tag:first-of-type': {
            marginLeft: '20px',
          },
          '& .MuiAutocomplete-input, & .MuiInputBase-input.MuiAutocomplete-input': {
            padding: '6.5px 8px !important',
            minWidth: '30px !important',
          },
        }
      : {
          '& .MuiAutocomplete-input, & .MuiInputBase-input.MuiAutocomplete-input': {
            padding: '16.5px 20px !important',
          },
        }),
  };
};

/** MUI X date/time pickers — отдельные компоненты, дублируем скругление и отступы */
const pickersOutlinedInputRootStyles = {
  borderRadius: INPUT_BORDER_RADIUS,
  paddingLeft: `${INPUT_PADDING_X}px`,
  paddingRight: `${INPUT_PADDING_X}px`,
  transition: 'background-color 220ms cubic-bezier(0.4, 0, 0.2, 1)',
  '& .MuiPickersOutlinedInput-notchedOutline': {
    borderRadius: `${INPUT_BORDER_RADIUS}px`,
    transition: OUTLINED_INPUT_OUTLINE_TRANSITION,
  },
  '&.MuiPickersInputBase-sizeSmall': {
    paddingLeft: `${INPUT_PADDING_X_SMALL}px`,
    paddingRight: `${INPUT_PADDING_X_SMALL}px`,
  },
  '&.MuiPickersInputBase-adornedStart': {
    paddingLeft: '14px',
  },
  '&.MuiPickersInputBase-adornedStart.MuiPickersInputBase-sizeSmall': {
    paddingLeft: '10px',
  },
  '&.MuiPickersInputBase-adornedEnd': {
    paddingRight: '10px',
  },
} as const;

/** Горизонтальный padding как у contained-кнопок (MUI text по умолчанию 6px 8px) */
const modalSecondaryButtonPadding = (theme: Theme) =>
  `${theme.spacing(0.75)} ${theme.spacing(2)} !important`;

/** Стили второстепенных кнопок в футере модалок (DialogActions и кастомные футеры) */
export const getModalFooterActionsSx = (theme: Theme) => ({
  '& .MuiButton-root': {
    textTransform: 'none' as const,
  },
  '& .MuiButton-root:not(.MuiButton-contained):not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
    padding: modalSecondaryButtonPadding(theme),
  },
  '& .MuiButton-text:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
    border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.75)' : theme.palette.primary.main}`,
    ...(theme.palette.mode === 'light' ? { color: `${MODAL_TEXT_PRIMARY_LIGHT} !important` } : {}),
    '&:hover': {
      borderColor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : theme.palette.primary.dark,
      backgroundColor: alpha(
        theme.palette.mode === 'light' ? theme.palette.common.white : theme.palette.primary.main,
        theme.palette.mode === 'light' ? 0.12 : theme.palette.action.hoverOpacity
      ),
    },
  },
  '& .MuiButton-outlined:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
    borderColor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.75) !important' : theme.palette.primary.main,
    color: theme.palette.mode === 'light' ? `${MODAL_TEXT_PRIMARY_LIGHT} !important` : theme.palette.primary.main,
    '&:hover': {
      borderColor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.95) !important' : theme.palette.primary.dark,
      backgroundColor: alpha(
        theme.palette.mode === 'light' ? theme.palette.common.white : theme.palette.primary.main,
        theme.palette.mode === 'light' ? 0.12 : 0.08
      ),
    },
  },
  ...(theme.palette.mode === 'light'
    ? {
        '& .MuiButton-contained:not(.MuiButton-colorError):not(.MuiButton-colorWarning):not(.Mui-disabled)': {
          bgcolor: `${theme.palette.primary.main} !important`,
          color: `${theme.palette.primary.contrastText} !important`,
          boxShadow: 'none !important',
          '&:hover': {
            bgcolor: `${theme.palette.primary.dark} !important`,
          },
        },
        '& .MuiButton-contained.Mui-disabled:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
          bgcolor: 'rgba(255, 255, 255, 0.22) !important',
          color: 'rgba(255, 255, 255, 0.55) !important',
          border: '1px solid rgba(255, 255, 255, 0.35) !important',
        },
      }
    : {}),
  '& .MuiButton-outlined.MuiButton-colorError, & .MuiButton-outlined.MuiButton-colorWarning': {
    padding: modalSecondaryButtonPadding(theme),
  },
  '& .MuiButton-text.MuiButton-colorError, & .MuiButton-text.MuiButton-colorWarning': {
    padding: modalSecondaryButtonPadding(theme),
  },
});

export type ThemePreference = 'light' | 'dark' | 'system';

export type PrimaryColorPreference = 'pink' | 'purple' | 'blue' | 'orange' | 'dark-red' | 'dark-green';

export interface PrimaryColorOption {
  id: PrimaryColorPreference;
  name: string;
  preview: string;
}

export const primaryColorOptions: PrimaryColorOption[] = [
  { id: 'pink', name: 'Розовый', preview: '#ff4b8d' },
  { id: 'purple', name: 'Тёмно-розовый', preview: '#8a2be2' },
  { id: 'blue', name: 'Голубой', preview: '#1e90ff' },
  { id: 'orange', name: 'Оранжевый', preview: '#ff8c00' },
  { id: 'dark-red', name: 'Красный', preview: '#8b0000' },
  { id: 'dark-green', name: 'Зелёный', preview: '#006400' },
];

const primaryPalettes: Record<
  PrimaryColorPreference,
  { light: { main: string; dark: string; light: string; contrastText: string }; dark: { main: string; dark: string; light: string; contrastText: string } }
> = {
  pink: {
    light: { main: '#ff4b8d', dark: '#e0437d', light: '#ff8fb3', contrastText: '#ffffff' },
    dark: { main: '#8f3d5c', dark: '#7a3450', light: '#5c2a3f', contrastText: '#ffffff' },
  },
  purple: {
    light: { main: '#8a2be2', dark: '#6e22b5', light: '#ba55d3', contrastText: '#ffffff' },
    dark: { main: '#6b3fa0', dark: '#5a3588', light: '#452966', contrastText: '#ffffff' },
  },
  blue: {
    light: { main: '#1e90ff', dark: '#1873cc', light: '#87cefa', contrastText: '#ffffff' },
    dark: { main: '#2b6cb0', dark: '#245a94', light: '#1a3d5c', contrastText: '#ffffff' },
  },
  orange: {
    light: { main: '#ff8c00', dark: '#cc7000', light: '#ffb347', contrastText: '#ffffff' },
    dark: { main: '#b87333', dark: '#9a6229', light: '#5c3818', contrastText: '#ffffff' },
  },
  'dark-red': {
    light: { main: '#8b0000', dark: '#6d0000', light: '#b22222', contrastText: '#ffffff' },
    dark: { main: '#7a2020', dark: '#631a1a', light: '#4a1515', contrastText: '#ffffff' },
  },
  'dark-green': {
    light: { main: '#006400', dark: '#005000', light: '#228b22', contrastText: '#ffffff' },
    dark: { main: '#2d5c2d', dark: '#254a25', light: '#1a351a', contrastText: '#ffffff' },
  },
};

export const getPrimaryPreviewColor = (color: PrimaryColorPreference): string =>
  primaryPalettes[color].light.main;

export const resolvePaletteMode = (
  preference: ThemePreference,
  prefersDarkMode: boolean
): PaletteMode => {
  if (preference === 'system') {
    return prefersDarkMode ? 'dark' : 'light';
  }
  return preference;
};

export const createAppTheme = (mode: PaletteMode, primaryColor: PrimaryColorPreference = 'pink') =>
  createTheme({
    palette: {
      mode,
      primary: primaryPalettes[primaryColor][mode],
      secondary: {
        main: mode === 'dark' ? '#7a63b8' : '#8c52ff',
      },
      ...(mode === 'dark'
        ? {
            background: {
              default: '#121212',
              paper: '#1e1e1e',
            },
          }
        : {}),
    },
    typography: {
      fontFamily: APP_FONT_FAMILY,
      h1: { fontFamily: APP_FONT_FAMILY, ...typographyScale.heading1 },
      h2: { fontFamily: APP_FONT_FAMILY, ...typographyScale.heading2 },
      h3: { fontFamily: APP_FONT_FAMILY, ...typographyScale.heading3 },
      h4: { fontFamily: APP_FONT_FAMILY, ...typographyScale.heading4 },
      h5: { fontFamily: APP_FONT_FAMILY, ...typographyScale.heading3, fontSize: '1.125rem' },
      h6: { fontFamily: APP_FONT_FAMILY, ...typographyScale.heading3, fontSize: '1rem' },
      body1: { letterSpacing: '-0.01em' },
      body2: { letterSpacing: '-0.01em' },
      caption: { fontFamily: APP_FONT_FAMILY, ...typographyScale.minitext },
      overline: { fontFamily: APP_FONT_FAMILY, ...typographyScale.miniMinitext },
    },
    components: {
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => getAppModalDialogPaperSx(theme) as Record<string, unknown>,
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: ({ theme }) => ({
            [theme.breakpoints.up('sm')]: getAppModalBackdropSx(theme),
          }),
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: ({ theme }) => getAppModalTitleSx(theme),
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: ({ theme }) => getAppModalContentSx(theme),
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...getAppModalActionsSx(theme),
            ...getModalFooterActionsSx(theme),
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: SURFACE_BORDER_RADIUS,
            textTransform: 'none',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          // Apply glass tint to every severity so MUI's standardError/Success slots don't win.
          standardSuccess: ({ theme }) => getAppAlertStyles(theme, 'success') as Record<string, unknown>,
          standardInfo: ({ theme }) => getAppAlertStyles(theme, 'info') as Record<string, unknown>,
          standardWarning: ({ theme }) => getAppAlertStyles(theme, 'warning') as Record<string, unknown>,
          standardError: ({ theme }) => getAppAlertStyles(theme, 'error') as Record<string, unknown>,
          outlinedSuccess: ({ theme }) => getAppAlertStyles(theme, 'success') as Record<string, unknown>,
          outlinedInfo: ({ theme }) => getAppAlertStyles(theme, 'info') as Record<string, unknown>,
          outlinedWarning: ({ theme }) => getAppAlertStyles(theme, 'warning') as Record<string, unknown>,
          outlinedError: ({ theme }) => getAppAlertStyles(theme, 'error') as Record<string, unknown>,
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: ({ theme }) =>
            HIDE_INPUT_LABELS
              ? {
                  // MUI прячет placeholder при наличии label до фокуса — при скрытых лейблах оставляем видимым
                  '& .MuiInputBase-input::placeholder, & .MuiInputBase-inputMultiline::placeholder': {
                    opacity: `${theme.palette.mode === 'light' ? 0.55 : 0.65} !important`,
                  },
                }
              : undefined,
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...outlinedInputRootStyles,
            '@supports (-webkit-touch-callout: none)': {
              '& .MuiOutlinedInput-notchedOutline legend': {
                visibility: 'visible',
              },
            },
            // Chrome autofill: прозрачный фон + фиксированный размер шрифта (иначе до фокуса меньше)
            '&.MuiOutlinedInput-root:has(.MuiInputBase-input:-webkit-autofill)': {
              bgcolor: 'transparent',
            },
            '& .MuiInputBase-input:-webkit-autofill, & .MuiInputBase-input:-webkit-autofill:hover, & .MuiInputBase-input:-webkit-autofill:focus, & .MuiInputBase-input:-webkit-autofill:active':
              getWebkitAutofillInputSx(theme),
          }),
          notchedOutline: ({ ownerState }) => getNotchedOutlineSlotStyles(ownerState.notched),
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            '& .MuiOutlinedInput-root': {
              padding: '0 !important',
              paddingRight: `${(ownerState.hasPopupIcon ? 30 : 0) + (ownerState.hasClearIcon ? 26 : 0)}px !important`,
              ...(ownerState.multiple
                ? {
                    paddingTop: '6px !important',
                    paddingBottom: '6px !important',
                  }
                : {}),
            },
            '& .MuiOutlinedInput-root .MuiAutocomplete-input': {
              opacity: 1,
            },
          }),
          inputRoot: ({ ownerState }) => getAutocompleteInputRootStyles(ownerState),
        },
      },
      MuiPickersOutlinedInput: {
        styleOverrides: {
          root: pickersOutlinedInputRootStyles,
          notchedOutline: ({ ownerState }) => getNotchedOutlineSlotStyles(ownerState.notched),
        },
      },
      MuiPickersLayout: {
        styleOverrides: {
          toolbar: {
            padding: '16px 16px 8px',
          },
          contentWrapper: {
            paddingTop: 12,
            paddingBottom: 12,
          },
          actionBar: {
            padding: '8px 16px 20px',
          },
        },
      },
      MuiPickerPopper: {
        styleOverrides: {
          paper: {
            borderRadius: SURFACE_BORDER_RADIUS,
            overflow: 'hidden',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: HIDE_INPUT_LABELS
            ? {
                display: 'none',
              }
            : undefined,
          outlined: ({ theme }) => ({
            ...(HIDE_INPUT_LABELS
              ? {
                  display: 'none',
                  // shrink-класс остаётся в DOM — не открываем notch под невидимый label
                  '&.MuiInputLabel-shrink + .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline legend, &.MuiInputLabel-shrink + .MuiPickersOutlinedInput-root .MuiPickersOutlinedInput-notchedOutline legend':
                    closedNotchedOutlineLegendStyles,
                }
              : {
                  // Совмещаем с padding инпута; shrink — правее дуги скругления
                  transform: `translate(${INPUT_PADDING_X}px, 16px) scale(1)`,
                  '&.MuiInputLabel-sizeSmall': {
                    transform: `translate(${INPUT_PADDING_X_SMALL}px, 9px) scale(1)`,
                  },
                  '&.MuiInputLabel-shrink': {
                    transform: `translate(${INPUT_LABEL_SHRINK_X}px, -9px) scale(0.75)`,
                    // Чуть шире запас под длинные лейблы при увеличенном translateX
                    maxWidth: `calc(133% - ${INPUT_LABEL_SHRINK_X + NOTCH_LEGEND_SPAN_PADDING_X * 2}px)`,
                  },
                  '&.Mui-focused': {
                    color: theme.palette.primary.main,
                  },
                  '&.MuiInputLabel-shrink + .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline legend, &.MuiInputLabel-shrink + .MuiPickersOutlinedInput-root .MuiPickersOutlinedInput-notchedOutline legend':
                    {
                      maxWidth: '100% !important',
                    },
                }),
            '&:not(.MuiInputLabel-shrink) + .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline legend':
              closedNotchedOutlineLegendStyles,
            '&:not(.MuiInputLabel-shrink) + .MuiPickersOutlinedInput-root .MuiPickersOutlinedInput-notchedOutline legend':
              closedNotchedOutlineLegendStyles,
          }),
        },
      },
      MuiCssBaseline: {
        styleOverrides: `
          body {
            font-family: ${APP_FONT_FAMILY};
          }

          /* Chrome autofill до фокуса уменьшает шрифт — чиним через ::first-line */
          input:-webkit-autofill::first-line,
          textarea:-webkit-autofill::first-line {
            font-size: 1rem !important;
            line-height: 1.4375em !important;
            font-family: ${APP_FONT_FAMILY} !important;
            letter-spacing: -0.01em !important;
          }

          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active,
          textarea:-webkit-autofill,
          textarea:-webkit-autofill:hover,
          textarea:-webkit-autofill:focus,
          textarea:-webkit-autofill:active {
            font-size: 1rem !important;
            line-height: 1.4375em !important;
            font-family: ${APP_FONT_FAMILY} !important;
            letter-spacing: -0.01em !important;
          }
        `,
      },
    },
  });

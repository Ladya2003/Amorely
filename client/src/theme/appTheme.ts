import { createTheme, PaletteMode, alpha, Theme } from '@mui/material/styles';
import '@mui/x-date-pickers/themeAugmentation';
import { APP_FONT_FAMILY, typographyScale } from './fonts';
import {
  getAppModalActionsSx,
  getAppModalContentSx,
  getAppModalDialogPaperSx,
  getAppModalTitleSx,
} from './modalStyles';
import { SURFACE_BORDER_RADIUS } from './surfaceStyles';

export { SURFACE_BORDER_RADIUS } from './surfaceStyles';

/** Скругление полей ввода — чуть меньше карточек, в той же шкале */
export const INPUT_BORDER_RADIUS = Math.round(SURFACE_BORDER_RADIUS * 0.75);

const outlinedInputRootStyles = {
  borderRadius: INPUT_BORDER_RADIUS,
  '& .MuiOutlinedInput-notchedOutline': {
    borderRadius: `${INPUT_BORDER_RADIUS}px`,
  },
  '& .MuiInputBase-input:not(.MuiInputBase-inputMultiline)': {
    paddingLeft: 20,
    paddingRight: 20,
  },
  '& .MuiInputBase-inputSizeSmall:not(.MuiInputBase-inputMultiline)': {
    paddingLeft: 16,
    paddingRight: 16,
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
    '& .MuiOutlinedInput-notchedOutline': {
      borderRadius: `${INPUT_BORDER_RADIUS}px`,
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
  paddingLeft: '20px',
  paddingRight: '20px',
  '& .MuiPickersOutlinedInput-notchedOutline': {
    borderRadius: `${INPUT_BORDER_RADIUS}px`,
  },
  '&.MuiPickersInputBase-sizeSmall': {
    paddingLeft: '16px',
    paddingRight: '16px',
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
    border: `1px solid ${theme.palette.primary.main}`,
    '&:hover': {
      borderColor: theme.palette.primary.dark,
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
    },
  },
  '& .MuiButton-outlined:not(.MuiButton-colorError):not(.MuiButton-colorWarning)': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    '&:hover': {
      borderColor: theme.palette.primary.dark,
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
  },
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
      MuiDialogTitle: {
        styleOverrides: {
          root: getAppModalTitleSx(),
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: getAppModalContentSx(),
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...getAppModalActionsSx(),
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
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            ...outlinedInputRootStyles,
            '@supports (-webkit-touch-callout: none)': {
              '& .MuiOutlinedInput-notchedOutline legend': {
                visibility: 'visible',
              },
            },
          },
          notchedOutline: {
            legend: {
              transition: 'none',
            },
          },
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
          notchedOutline: {
            legend: {
              transition: 'none',
            },
          },
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
          outlined: ({ theme }) => ({
            '&.Mui-focused': {
              color: theme.palette.primary.main,
            },
            '&:not(.MuiInputLabel-shrink) + .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline legend': {
              maxWidth: '0.01px !important',
              padding: 0,
            },
            '&:not(.MuiInputLabel-shrink) + .MuiPickersOutlinedInput-root .MuiPickersOutlinedInput-notchedOutline legend': {
              maxWidth: '0.01px !important',
              padding: 0,
            },
          }),
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: APP_FONT_FAMILY,
          },
        },
      },
    },
  });

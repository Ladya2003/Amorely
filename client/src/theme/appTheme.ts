import { createTheme, PaletteMode } from '@mui/material/styles';

const bodyFontFamily = '"Roboto", "Arial", sans-serif';
const headingFontFamily = '"Oswald", sans-serif';

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
      fontFamily: bodyFontFamily,
      h1: { fontFamily: headingFontFamily },
      h2: { fontFamily: headingFontFamily },
      h3: { fontFamily: headingFontFamily },
      h4: { fontFamily: headingFontFamily },
      h5: { fontFamily: headingFontFamily },
      h6: { fontFamily: headingFontFamily },
    },
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            legend: {
              transition: 'none',
            },
          },
          root: {
            '@supports (-webkit-touch-callout: none)': {
              '& .MuiOutlinedInput-notchedOutline legend': {
                visibility: 'visible',
              },
            },
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
          }),
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFamily: bodyFontFamily,
          },
          h1: { fontFamily: headingFontFamily },
          h2: { fontFamily: headingFontFamily },
          h3: { fontFamily: headingFontFamily },
          h4: { fontFamily: headingFontFamily },
          h5: { fontFamily: headingFontFamily },
          h6: { fontFamily: headingFontFamily },
        },
      },
    },
  });

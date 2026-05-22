import { createTheme, PaletteMode } from '@mui/material/styles';

const bodyFontFamily = '"Roboto", "Arial", sans-serif';
const headingFontFamily = '"Oswald", sans-serif';

export type ThemePreference = 'light' | 'dark' | 'system';

export const resolvePaletteMode = (
  preference: ThemePreference,
  prefersDarkMode: boolean
): PaletteMode => {
  if (preference === 'system') {
    return prefersDarkMode ? 'dark' : 'light';
  }
  return preference;
};

const primaryPalette = {
  light: {
    main: '#ff4b8d',
    dark: '#e0437d',
    light: '#ff8fb3',
    contrastText: '#ffffff',
  },
  dark: {
    main: '#b84d6f',
    dark: '#9a4160',
    light: '#6f3f52',
    contrastText: '#ffffff',
  },
} as const;

export const createAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: primaryPalette[mode],
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
            '@supports (-webkit-touch-callout: none)': {
              '&.MuiInputLabel-shrink': {
                px: '4px',
                mx: '-4px',
                backgroundColor: theme.palette.background.paper,
                zIndex: 1,
              },
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

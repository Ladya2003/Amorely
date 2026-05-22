import React, { useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from './AuthContext';
import { createAppTheme, resolvePaletteMode, ThemePreference } from '../theme/appTheme';

interface AppThemeProviderProps {
  children: React.ReactNode;
}

const AppThemeProvider: React.FC<AppThemeProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true });
  const themePreference: ThemePreference = user?.theme || 'system';
  const paletteMode = resolvePaletteMode(themePreference, prefersDarkMode);
  const theme = useMemo(() => createAppTheme(paletteMode), [paletteMode]);

  useEffect(() => {
    document.documentElement.style.colorScheme = paletteMode;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', paletteMode === 'dark' ? '#1e1e1e' : '#ff4b8d');
    }
  }, [paletteMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;

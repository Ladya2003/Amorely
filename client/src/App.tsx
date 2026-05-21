import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { CryptoProvider } from './contexts/CryptoContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import FeedPage from './pages/FeedPage';
import ChatPage from './pages/ChatPage';
import CalendarPage from './pages/CalendarPage';
import NewsPage from './pages/NewsPage';
import SettingsPage from './pages/SettingsPage';
import ChatRulesPage from './pages/ChatRulesPage';
import AuthPage from './pages/AuthPage';
import CryptoUnlockPage from './pages/CryptoUnlockPage';

const bodyFontFamily = '"Roboto", "Arial", sans-serif';
const headingFontFamily = '"Oswald", sans-serif';

// Создаем тему с основным цветом приложения
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff4b8d',
    },
    secondary: {
      main: '#8c52ff',
    },
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

const getRouterBasename = (): string | undefined => {
  const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (!publicUrl || publicUrl === '/') {
    return undefined;
  }

  // Локально CRA часто открывается с /, а homepage задаёт /Amorely только для GitHub Pages.
  if (process.env.NODE_ENV === 'development' && !window.location.pathname.startsWith(publicUrl)) {
    return undefined;
  }

  return publicUrl;
};

function App() {
  const routerBasename = getRouterBasename();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CryptoProvider>
          <NavigationProvider>
            <Router basename={routerBasename}>
              <Routes>
                {/* Публичный маршрут для аутентификации */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Защищенный маршрут восстановления ключей */}
                <Route
                  path="/crypto/unlock"
                  element={
                    <ProtectedRoute bypassCryptoCheck>
                      <CryptoUnlockPage />
                    </ProtectedRoute>
                  }
                />

                {/* Защищенные маршруты */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<FeedPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="legal/chat-rules" element={<ChatRulesPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="news" element={<NewsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Перенаправление на главную страницу для неизвестных маршрутов */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </NavigationProvider>
        </CryptoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import FeedPage from './pages/FeedPage';
import ChatPage from './pages/ChatPage';
import NewsPage from './pages/NewsPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';

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
    fontFamily: '"Roboto", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Публичный маршрут для аутентификации */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Защищенные маршруты */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<FeedPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            {/* Перенаправление на главную страницу для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

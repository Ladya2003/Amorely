import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppThemeProvider from './contexts/AppThemeProvider';
import { NavigationProvider } from './contexts/NavigationContext';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import { UnreadNewsProvider } from './contexts/UnreadNewsContext';
import { CryptoProvider } from './contexts/CryptoContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import FeedPage from './pages/FeedPage';
import ChatPage from './pages/ChatPage';
import GamePage from './pages/GamePage';
import GamePlayPage from './pages/GamePlayPage';
import CalendarPage from './pages/CalendarPage';
import NewsPage from './pages/NewsPage';
import SettingsPage from './pages/SettingsPage';
import ChatRulesPage from './pages/ChatRulesPage';
import AuthPage from './pages/AuthPage';
import CryptoUnlockPage from './pages/CryptoUnlockPage';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/Auth/AdminRoute';

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
    <AuthProvider>
      <AppThemeProvider>
        <CryptoProvider>
          <NavigationProvider>
            <Router basename={routerBasename}>
              <UnreadMessagesProvider>
              <UnreadNewsProvider>
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
                  <Route path="chat/games/:gameId" element={<GamePage />} />
                  <Route path="chat/games/:gameId/play" element={<GamePlayPage />} />
                  <Route path="legal/chat-rules" element={<ChatRulesPage />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="news" element={<NewsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route
                    path="admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                </Route>

                {/* Перенаправление на главную страницу для неизвестных маршрутов */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </UnreadNewsProvider>
              </UnreadMessagesProvider>
            </Router>
          </NavigationProvider>
        </CryptoProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}

export default App;

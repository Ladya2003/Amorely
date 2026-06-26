import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAlertsProvider } from './contexts/AdminAlertsContext';
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
import PetDetailPage from './pages/PetDetailPage';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/Auth/AdminRoute';
import PartnerBreakupNotifier from './components/Settings/PartnerBreakupNotifier';
import BlockNoticeSnackbar from './components/Auth/BlockNoticeSnackbar';
import CalendarPartnerMigrationRunner from './components/Calendar/CalendarPartnerMigrationRunner';
import CurrencyAwardOverlay from './components/Pets/CurrencyAwardOverlay';

const PushNavigationListener: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return undefined;
    }

    const stripBasename = (path: string) => {
      const publicUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
      if (!publicUrl || publicUrl === '/') {
        return path;
      }
      if (path === publicUrl) {
        return '/';
      }
      if (path.startsWith(`${publicUrl}/`)) {
        return path.slice(publicUrl.length) || '/';
      }
      return path;
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | null;
      if (data?.type === 'PUSH_NAVIGATE' && typeof data.url === 'string') {
        navigate(stripBasename(data.url));
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [navigate]);

  return null;
};

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
      <AdminAlertsProvider>
      <BlockNoticeSnackbar />
      <CurrencyAwardOverlay />
      <AppThemeProvider>
        <PartnerBreakupNotifier />
        <CryptoProvider>
          <CalendarPartnerMigrationRunner />
          <NavigationProvider>
            <Router basename={routerBasename}>
              <PushNavigationListener />
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
                  <Route path="pets/:petId" element={<PetDetailPage />} />
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
      </AdminAlertsProvider>
    </AuthProvider>
  );
}

export default App;

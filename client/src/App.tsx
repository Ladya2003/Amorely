import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAlertsProvider } from './contexts/AdminAlertsContext';
import AppThemeProvider from './contexts/AppThemeProvider';
import { NavigationProvider } from './contexts/NavigationContext';
import { UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import { UnreadNewsProvider } from './contexts/UnreadNewsContext';
import { PendingPartnerRequestsProvider } from './contexts/PendingPartnerRequestsContext';
import { MemoryRestoreProvider } from './contexts/MemoryRestoreContext';
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
import LegalDocumentPage from './pages/LegalDocumentPage';
import SupportPage from './pages/SupportPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import CryptoUnlockPage from './pages/CryptoUnlockPage';
import PetDetailPage from './pages/PetDetailPage';
import DatingIdeasPage from './pages/DatingIdeasPage';
import AdminRequestPage from './pages/AdminRequestPage';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/Auth/AdminRoute';
import LandingRoute from './components/Auth/LandingRoute';
import PartnerBreakupNotifier from './components/Settings/PartnerBreakupNotifier';
import BlockNoticeSnackbar from './components/Auth/BlockNoticeSnackbar';
import CalendarPartnerMigrationRunner from './components/Calendar/CalendarPartnerMigrationRunner';
import CurrencyAwardOverlay from './components/Pets/CurrencyAwardOverlay';
import AppDateLocalizationProvider from './components/UI/AppDateLocalizationProvider';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import {
  LANDING_LOCALES,
  getLandingPath,
  resolvePreferredLandingLocale,
} from './localization/landingLocale';

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

  // Локально CRA открывается с /, а PUBLIC_URL из homepage может отличаться в проде.
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
        <AppDateLocalizationProvider>
        <PartnerBreakupNotifier />
        <CryptoProvider>
          <CalendarPartnerMigrationRunner />
          <NavigationProvider>
            <Router basename={routerBasename}>
              <PushNavigationListener />
              <UnreadMessagesProvider>
              <UnreadNewsProvider>
              <PendingPartnerRequestsProvider>
              <MemoryRestoreProvider>
              <Routes>
                {/* Старый URL лендинга → preferred locale (GH Pages: `/auth` goes via 404.html) */}
                <Route
                  path="/auth"
                  element={
                    <Navigate to={getLandingPath(resolvePreferredLandingLocale())} replace />
                  }
                />

                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/terms" element={<LegalDocumentPage docId="terms" />} />
                <Route path="/privacy" element={<LegalDocumentPage docId="privacy" />} />
                <Route path="/offer" element={<LegalDocumentPage docId="offer" />} />
                <Route path="/payment" element={<LegalDocumentPage docId="payment" />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/legal/chat-rules" element={<Navigate to="/terms" replace />} />

                {/* Защищенный маршрут восстановления ключей */}
                <Route
                  path="/crypto/unlock"
                  element={
                    <ProtectedRoute bypassCryptoCheck>
                      <CryptoUnlockPage />
                    </ProtectedRoute>
                  }
                />

                {/* Localized marketing landings for guests (`/en`, `/ru`, `/es`, …).
                    Explicit paths — do not use `/:lang` or it can steal `/chat` etc. */}
                {LANDING_LOCALES.map((lang) => (
                  <Route key={lang} path={`/${lang}`} element={<LandingRoute />} />
                ))}

                {/* `/` and app routes — authenticated shell; guests redirect to `/{locale}` */}
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
                  <Route path="dating-ideas" element={<DatingIdeasPage />} />
                  <Route path="write-admin" element={<AdminRequestPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="chat/games/:gameId" element={<GamePage />} />
                  <Route path="chat/games/:gameId/play" element={<GamePlayPage />} />
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

                <Route
                  path="*"
                  element={
                    <Navigate to={getLandingPath(resolvePreferredLandingLocale())} replace />
                  }
                />
              </Routes>
              </MemoryRestoreProvider>
              </PendingPartnerRequestsProvider>
              </UnreadNewsProvider>
              </UnreadMessagesProvider>
            </Router>
          </NavigationProvider>
        </CryptoProvider>
        </AppDateLocalizationProvider>
      </AppThemeProvider>
      </AdminAlertsProvider>
    </AuthProvider>
  );
}

export default App;

import React, { Suspense, useEffect } from 'react';
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
import AdminRoute from './components/Auth/AdminRoute';
import LandingRoute from './components/Auth/LandingRoute';
import PartnerBreakupNotifier from './components/Settings/PartnerBreakupNotifier';
import BlockNoticeSnackbar from './components/Auth/BlockNoticeSnackbar';
import CalendarPartnerMigrationRunner from './components/Calendar/CalendarPartnerMigrationRunner';
import CurrencyAwardOverlay from './components/Pets/CurrencyAwardOverlay';
import AppDateLocalizationProvider from './components/UI/AppDateLocalizationProvider';
import BrandLoader from './components/common/BrandLoader';
import { FeedHomeProvider } from './contexts/FeedHomeContext';
import {
  AdminPage,
  AdminRequestPage,
  BlogPage,
  BlogPostPage,
  CalendarPage,
  ChatPage,
  CryptoUnlockPage,
  DatingIdeasPage,
  FeedPage,
  GamePage,
  GamePlayPage,
  LegalDocumentPage,
  NewsPage,
  PetDetailPage,
  ResetPasswordPage,
  SettingsPage,
  SupportPage,
  VerifyEmailPage,
} from './routing/lazyPages';
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
              <Suspense fallback={<BrandLoader fullscreen />}>
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
                  <Route
                    index
                    element={
                      <FeedHomeProvider>
                        <FeedPage />
                      </FeedHomeProvider>
                    }
                  />
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
              </Suspense>
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

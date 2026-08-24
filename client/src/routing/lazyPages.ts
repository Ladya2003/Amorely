import { lazy } from 'react';

export const FeedPage = lazy(() => import('../pages/FeedPage'));
export const ChatPage = lazy(() => import('../pages/ChatPage'));
export const GamePage = lazy(() => import('../pages/GamePage'));
export const GamePlayPage = lazy(() => import('../pages/GamePlayPage'));
export const CalendarPage = lazy(() => import('../pages/CalendarPage'));
export const NewsPage = lazy(() => import('../pages/NewsPage'));
export const SettingsPage = lazy(() => import('../pages/SettingsPage'));
export const LegalDocumentPage = lazy(() => import('../pages/LegalDocumentPage'));
export const SupportPage = lazy(() => import('../pages/SupportPage'));
export const BlogPage = lazy(() => import('../pages/BlogPage'));
export const BlogPostPage = lazy(() => import('../pages/BlogPostPage'));
export const CryptoUnlockPage = lazy(() => import('../pages/CryptoUnlockPage'));
export const PetDetailPage = lazy(() => import('../pages/PetDetailPage'));
export const DatingIdeasPage = lazy(() => import('../pages/DatingIdeasPage'));
export const AdminRequestPage = lazy(() => import('../pages/AdminRequestPage'));
export const AdminPage = lazy(() => import('../pages/AdminPage'));
export const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage'));
export const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));

const routePrefetchers: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/FeedPage'),
  '/chat': () => import('../pages/ChatPage'),
  '/calendar': () => import('../pages/CalendarPage'),
  '/news': () => import('../pages/NewsPage'),
  '/settings': () => import('../pages/SettingsPage'),
};

export const prefetchRoute = (path: string) => {
  const prefetch = routePrefetchers[path];
  if (prefetch) {
    void prefetch();
  }
};

export const prefetchFeedPage = () => {
  void import('../pages/FeedPage');
};

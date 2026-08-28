import React, { lazy, Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import BrandLoader from '../components/common/BrandLoader';
import { getGameById, isGameVisibleToUser } from '../components/Chat/gamesData';
import { useAuth } from '../contexts/AuthContext';

const TapGamePlayPage = lazy(() => import('./TapGamePlayPage'));
const GeoGamePlayPage = lazy(() => import('./GeoGamePlayPage'));
const DrawGamePlayPage = lazy(() => import('./DrawGamePlayPage'));
const QuizGamePlayPage = lazy(() => import('./QuizGamePlayPage'));
const CliffGamePlayPage = lazy(() => import('./CliffGamePlayPage'));

const GamePlayPage: React.FC = () => {
  const { gameId = '' } = useParams();
  const { user, isLoading } = useAuth();
  const game = getGameById(gameId);

  if (isLoading) {
    return <BrandLoader fullscreen />;
  }

  if (!game || !isGameVisibleToUser(game, user?.role)) {
    return <Navigate to="/chat?tab=games" replace />;
  }

  if (gameId === 'tap') {
    return (
      <Suspense fallback={<BrandLoader fullscreen />}>
        <TapGamePlayPage />
      </Suspense>
    );
  }

  if (gameId === 'geo') {
    return (
      <Suspense fallback={<BrandLoader fullscreen />}>
        <GeoGamePlayPage />
      </Suspense>
    );
  }

  if (gameId === 'draw') {
    return (
      <Suspense fallback={<BrandLoader fullscreen />}>
        <DrawGamePlayPage />
      </Suspense>
    );
  }

  if (gameId === 'quiz') {
    return (
      <Suspense fallback={<BrandLoader fullscreen />}>
        <QuizGamePlayPage />
      </Suspense>
    );
  }

  if (gameId === 'cliff') {
    return (
      <Suspense fallback={<BrandLoader fullscreen />}>
        <CliffGamePlayPage />
      </Suspense>
    );
  }

  return <Navigate to={`/chat/games/${gameId}`} replace />;
};

export default GamePlayPage;

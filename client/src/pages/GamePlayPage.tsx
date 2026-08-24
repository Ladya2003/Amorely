import React, { lazy, Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import BrandLoader from '../components/common/BrandLoader';

const TapGamePlayPage = lazy(() => import('./TapGamePlayPage'));
const GeoGamePlayPage = lazy(() => import('./GeoGamePlayPage'));
const DrawGamePlayPage = lazy(() => import('./DrawGamePlayPage'));
const QuizGamePlayPage = lazy(() => import('./QuizGamePlayPage'));

const GamePlayPage: React.FC = () => {
  const { gameId = '' } = useParams();

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

  return <Navigate to={`/chat/games/${gameId}`} replace />;
};

export default GamePlayPage;

import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import TapGamePlayPage from './TapGamePlayPage';
import GeoGamePlayPage from './GeoGamePlayPage';
import DrawGamePlayPage from './DrawGamePlayPage';
import QuizGamePlayPage from './QuizGamePlayPage';

const GamePlayPage: React.FC = () => {
  const { gameId = '' } = useParams();

  if (gameId === 'tap') {
    return <TapGamePlayPage />;
  }

  if (gameId === 'geo') {
    return <GeoGamePlayPage />;
  }

  if (gameId === 'draw') {
    return <DrawGamePlayPage />;
  }

  if (gameId === 'quiz') {
    return <QuizGamePlayPage />;
  }

  return <Navigate to={`/chat/games/${gameId}`} replace />;
};

export default GamePlayPage;

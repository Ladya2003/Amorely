import mongoose from 'mongoose';
import DrawGameState from '../models/drawGameState';
import GeoGameState from '../models/geoGameState';
import QuizGameState from '../models/quizGameState';

export type DailyResetGameId = 'geo' | 'draw' | 'quiz';

export interface GameDailyResetStatus {
  hasPlayed: boolean;
}

export type GameDailyResetMap = Record<DailyResetGameId, GameDailyResetStatus | null>;

const hasPlayedGeo = (state: { roundsCompleted?: number; usedLocationIds?: string[] }) =>
  (state.roundsCompleted ?? 0) > 0 || (state.usedLocationIds?.length ?? 0) > 0;

const hasPlayedDraw = (state: { roundsCompleted?: number; usedWordIds?: string[] }) =>
  (state.roundsCompleted ?? 0) > 0 || (state.usedWordIds?.length ?? 0) > 0;

const hasPlayedQuiz = (state: {
  usedCellKeys?: string[];
  totalScore?: number;
  nextBoardAvailableAt?: Date | null;
}) =>
  (state.usedCellKeys?.length ?? 0) > 0 ||
  (state.totalScore ?? 0) > 0 ||
  Boolean(state.nextBoardAvailableAt);

export const getGameDailyResetStatus = async (
  relationshipId: mongoose.Types.ObjectId | string
): Promise<GameDailyResetMap> => {
  const [geoState, drawState, quizState] = await Promise.all([
    GeoGameState.findOne({ relationshipId }).select('roundsCompleted usedLocationIds').lean(),
    DrawGameState.findOne({ relationshipId }).select('roundsCompleted usedWordIds').lean(),
    QuizGameState.findOne({ relationshipId })
      .select('usedCellKeys totalScore nextBoardAvailableAt')
      .lean(),
  ]);

  return {
    geo: geoState && hasPlayedGeo(geoState) ? { hasPlayed: true } : null,
    draw: drawState && hasPlayedDraw(drawState) ? { hasPlayed: true } : null,
    quiz: quizState && hasPlayedQuiz(quizState) ? { hasPlayed: true } : null,
  };
};

export const getSingleGameDailyResetStatus = async (
  gameId: string,
  relationshipId: mongoose.Types.ObjectId | string
): Promise<GameDailyResetStatus | null> => {
  const statuses = await getGameDailyResetStatus(relationshipId);
  if (gameId === 'geo' || gameId === 'draw' || gameId === 'quiz') {
    return statuses[gameId];
  }
  return null;
};

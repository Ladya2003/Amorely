import mongoose from 'mongoose';
import DrawGameState from '../models/drawGameState';
import GeoGameState from '../models/geoGameState';
import QuizGameState from '../models/quizGameState';
import { getUtcDayKey } from '../utils/dailyReset';

export type DailyResetGameId = 'geo' | 'draw' | 'quiz';

export interface GameDailyResetStatus {
  hasPlayed: boolean;
}

export type GameDailyResetMap = Record<DailyResetGameId, GameDailyResetStatus | null>;

const hasPlayedGeoToday = (state: { roundsDayKey?: string | null; roundsPlayedToday?: number }) => {
  const today = getUtcDayKey();
  if (state.roundsDayKey !== today) {
    return false;
  }
  return (state.roundsPlayedToday ?? 0) > 0;
};

const hasPlayedDrawToday = (state: {
  scoredRoundsDayKey?: string | null;
  scoredRoundsToday?: number;
}) => {
  const today = getUtcDayKey();
  if (state.scoredRoundsDayKey !== today) {
    return false;
  }
  return (state.scoredRoundsToday ?? 0) > 0;
};

const hasPlayedQuizToday = (state: {
  boardDayKey?: string | null;
  usedCellKeys?: string[];
  nextBoardAvailableAt?: Date | null;
}) => {
  const today = getUtcDayKey();
  if (
    state.nextBoardAvailableAt &&
    state.nextBoardAvailableAt.getTime() > Date.now()
  ) {
    return true;
  }
  return state.boardDayKey === today && (state.usedCellKeys?.length ?? 0) > 0;
};

export const getGameDailyResetStatus = async (
  relationshipId: mongoose.Types.ObjectId | string
): Promise<GameDailyResetMap> => {
  const [geoState, drawState, quizState] = await Promise.all([
    GeoGameState.findOne({ relationshipId }).select('roundsDayKey roundsPlayedToday').lean(),
    DrawGameState.findOne({ relationshipId })
      .select('scoredRoundsDayKey scoredRoundsToday')
      .lean(),
    QuizGameState.findOne({ relationshipId })
      .select('boardDayKey usedCellKeys nextBoardAvailableAt')
      .lean(),
  ]);

  return {
    geo: geoState && hasPlayedGeoToday(geoState) ? { hasPlayed: true } : null,
    draw: drawState && hasPlayedDrawToday(drawState) ? { hasPlayed: true } : null,
    quiz: quizState && hasPlayedQuizToday(quizState) ? { hasPlayed: true } : null,
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

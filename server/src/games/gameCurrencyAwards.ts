import type { Server as SocketIOServer } from 'socket.io';
import { awardGameDailyComplete, awardGameRound } from '../utils/currencyRewards';
import type { CurrencyAwardResult } from '../services/currencyService';
import { GEO_MAX_ROUNDS_PER_DAY } from './geoGameConfig';
import { DRAW_MAX_SCORED_ROUNDS_PER_DAY } from './drawGameConfig';
import { QUIZ_BOARD_QUESTIONS_PER_CATEGORY, QUIZ_DAILY_CATEGORY_COUNT } from './quizGameConfig';

type ConnectedUser = { userId: string; socketId: string };

export const GAME_DAILY_COMPLETE_AMOUNTS = {
  geo: GEO_MAX_ROUNDS_PER_DAY * 3,
  draw: DRAW_MAX_SCORED_ROUNDS_PER_DAY * 3,
  quiz: QUIZ_DAILY_CATEGORY_COUNT * QUIZ_BOARD_QUESTIONS_PER_CATEGORY * 3,
} as const;
let ioRef: SocketIOServer | null = null;
let connectedUsersRef: ConnectedUser[] = [];

export const bindGameCurrencyNotify = (io: SocketIOServer, connectedUsers: ConnectedUser[]) => {
  ioRef = io;
  connectedUsersRef = connectedUsers;
};

const notifyUser = (userId: string, award: CurrencyAwardResult) => {
  if (!award.awarded || award.amount <= 0 || !ioRef) {
    return;
  }

  const target = connectedUsersRef.find((user) => user.userId === userId);
  if (target) {
    ioRef.to(target.socketId).emit('currency_awarded', {
      awardedAmount: award.amount,
      balance: award.balance,
    });
  }
};

export const notifyCurrencyAward = notifyUser;

export const awardGameRoundToUser = async (userId: string, gameId: string, roundKey: string) => {
  const award = await awardGameRound(userId, gameId, roundKey);
  notifyUser(userId, award);
  return award;
};

export const awardGameRoundToParticipants = async (
  participantIds: string[],
  gameId: string,
  roundKey: string
) => {
  await Promise.all(
    participantIds.map(async (userId) => {
      const award = await awardGameRound(userId, gameId, roundKey);
      notifyUser(userId, award);
    })
  );
};

export const awardGameDailyCompleteToParticipants = async (
  participantIds: string[],
  gameId: string,
  dayKey: string,
  amount: number
) => {
  await Promise.all(
    participantIds.map(async (userId) => {
      const award = await awardGameDailyComplete(userId, gameId, dayKey, amount);
      notifyUser(userId, award);
    })
  );
};
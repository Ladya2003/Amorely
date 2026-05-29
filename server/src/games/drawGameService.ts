import mongoose from 'mongoose';
import Relationship from '../models/relationship';
import User from '../models/user';
import DrawGameState from '../models/drawGameState';
import { requireActiveRelationship } from '../utils/requireActiveRelationship';
import { getUtcDayKey } from '../utils/dailyReset';
import {
  DRAW_LOBBY_COUNTDOWN_SEC,
  DRAW_MAX_GUESS_ATTEMPTS_PER_ROUND,
  DRAW_MAX_SCORED_ROUNDS,
  DRAW_MAX_SCORED_ROUNDS_PER_DAY,
  DRAW_ROUND_DRAWING_SEC,
  DRAW_ROUND_GUESSING_SEC,
  calculateDrawGuessScore,
  getDrawWord,
  isDrawGuessCorrect,
  buildUsedWordIdsAfterPick,
  pickRandomDrawWord,
} from './drawGameConfig';

export interface DrawGameRelationship {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
}

export interface DrawGameContext {
  relationship: DrawGameRelationship;
  ownerUserId: string;
  partnerUserId: string;
}

export interface DrawStrokePublic {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  isEraser?: boolean;
}

export interface DrawGuessAttemptPublic {
  userId: string;
  text: string;
  isOwnGuess: boolean;
}

export interface DrawGamePublicState {
  relationshipId: string;
  hasPartner: true;
  totalScore: number;
  roundsCompleted: number;
  scoredRoundsCompleted: number;
  maxScoredRounds: number;
  scoredRoundsToday: number;
  maxScoredRoundsPerDay: number;
  dailyScoredLimitReached: boolean;
  canEarnRatingPoints: boolean;
  roundTimeDrawingSec: number;
  roundTimeGuessingSec: number;
  inLobby: boolean;
  lobbyCountdownSec: number;
  readyUserIds: string[];
  lobbySecondsRemaining: number;
  waitingForPartnerResults: boolean;
  allScoredRoundsDone: boolean;
  currentRound: {
    wordId: string;
    drawerUserId: string;
    status: 'drawing' | 'awaiting_guesser' | 'guessing' | 'revealed';
    drawingSecondsRemaining: number;
    guessingSecondsRemaining: number;
    strokes: DrawStrokePublic[];
    guessAttempts: DrawGuessAttemptPublic[];
    yourWord: string | null;
    isDrawer: boolean;
    isGuesser: boolean;
    reveal: {
      word: string;
      guessText: string | null;
      wasCorrect: boolean;
      pointsEarned: number;
    } | null;
  } | null;
}

export class DrawGameError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const resolveDrawGameContext = async (userId: string): Promise<DrawGameContext> => {
  const relationshipContext = await requireActiveRelationship(userId);

  if (!relationshipContext) {
    throw new DrawGameError(
      'NO_PARTNER',
      'Для игры нужен партнёр. Добавьте его в настройках профиля.'
    );
  }

  const relationship = relationshipContext.relationship as DrawGameRelationship;

  return {
    relationship,
    ownerUserId: relationship.userId.toString(),
    partnerUserId: relationshipContext.partnerId,
  };
};

const getSecondsRemaining = (deadlineAt: Date | null) => {
  if (!deadlineAt) {
    return 0;
  }
  return Math.max(0, Math.ceil((deadlineAt.getTime() - Date.now()) / 1000));
};

const getDismissedRevealUserIds = (round: any): string[] =>
  (round?.dismissedRevealUserIds || []).map((id: { toString(): string }) => id.toString());

const hasUserDismissedReveal = (round: any, userId: string) =>
  round?.status === 'revealed' && getDismissedRevealUserIds(round).includes(userId);

const shouldHideRevealFromViewer = (round: any, viewerUserId?: string) =>
  Boolean(viewerUserId && hasUserDismissedReveal(round, viewerUserId));

const startLobbyCountdownIfAllReady = async (state: any, participantIds: string[]) => {
  const readyIds = new Set<string>(
    (state.readyUserIds || []).map((id: { toString(): string }) => id.toString())
  );
  const allReady = participantIds.every((participantId) => readyIds.has(participantId));

  if (!allReady || state.lobbyCountdownEndsAt || state.currentRound) {
    return state;
  }

  const countdownEndsAt = new Date(Date.now() + DRAW_LOBBY_COUNTDOWN_SEC * 1000);
  const withCountdown = await DrawGameState.findOneAndUpdate(
    {
      _id: state._id,
      currentRound: null,
      lobbyCountdownEndsAt: null,
    },
    { $set: { lobbyCountdownEndsAt: countdownEndsAt } },
    { new: true }
  );

  return withCountdown || state;
};

const getDrawerUserIdForRound = (context: DrawGameContext, roundsCompleted: number) => {
  const ids = [context.relationship.userId.toString(), context.relationship.partnerId.toString()].sort();
  return ids[roundsCompleted % 2];
};

const syncDailyScoredCounters = (state: any) => {
  const today = getUtcDayKey();
  if (state.scoredRoundsDayKey !== today) {
    state.scoredRoundsDayKey = today;
    state.scoredRoundsToday = 0;
  }
};

const getScoredRoundsToday = (state: any) => {
  syncDailyScoredCounters(state);
  return state.scoredRoundsToday ?? 0;
};

const hasCompletedAllScoredRounds = (state: { scoredRoundsCompleted?: number }) =>
  (state.scoredRoundsCompleted ?? 0) >= DRAW_MAX_SCORED_ROUNDS;

const hasReachedDailyScoredLimit = (state: any) =>
  getScoredRoundsToday(state) >= DRAW_MAX_SCORED_ROUNDS_PER_DAY;

const canEarnRatingPoints = (state: any) =>
  !hasCompletedAllScoredRounds(state) && !hasReachedDailyScoredLimit(state);

const awardRoundPoints = (state: any, pointsEarned: number) => {
  if (!canEarnRatingPoints(state)) {
    return;
  }
  state.totalScore += pointsEarned;
  state.scoredRoundsCompleted += 1;
  state.scoredRoundsToday = getScoredRoundsToday(state) + 1;
  state.scoredRoundsDayKey = getUtcDayKey();
};

const buildDrawRatingMeta = (state: any) => {
  const scoredRoundsToday = getScoredRoundsToday(state);
  const dailyScoredLimitReached = scoredRoundsToday >= DRAW_MAX_SCORED_ROUNDS_PER_DAY;

  return {
    scoredRoundsToday,
    maxScoredRoundsPerDay: DRAW_MAX_SCORED_ROUNDS_PER_DAY,
    dailyScoredLimitReached,
    canEarnRatingPoints: canEarnRatingPoints(state),
  };
};

const buildNewRoundPayload = (context: DrawGameContext, state: any) => {
  const previousUsedWordIds = state.usedWordIds || [];
  const word = pickRandomDrawWord(previousUsedWordIds);
  if (!word) {
    return null;
  }

  const usedWordIds = buildUsedWordIdsAfterPick(previousUsedWordIds, word.id);

  const drawerUserId = getDrawerUserIdForRound(context, state.roundsCompleted ?? 0);
  const drawingStartedAt = new Date();
  const drawingDeadlineAt = new Date(drawingStartedAt.getTime() + DRAW_ROUND_DRAWING_SEC * 1000);

  return {
    usedWordIds,
    currentRound: {
      wordId: word.id,
      drawerUserId: new mongoose.Types.ObjectId(drawerUserId),
      status: 'drawing' as const,
      drawingStartedAt,
      drawingDeadlineAt,
      guessingStartedAt: drawingStartedAt,
      guessingDeadlineAt: drawingDeadlineAt,
      strokes: [],
      guessAttempts: [],
      guessText: null,
      guessedByUserId: null,
      pointsEarned: null,
      wasCorrect: null,
      dismissedRevealUserIds: [],
    },
  };
};

const startNewRoundAtomic = async (stateId: mongoose.Types.ObjectId, context: DrawGameContext) => {
  const state = await DrawGameState.findById(stateId);
  if (!state || state.currentRound) {
    return state;
  }

  const roundPayload = buildNewRoundPayload(context, state);
  if (!roundPayload) {
    return DrawGameState.findByIdAndUpdate(
      stateId,
      { $set: { readyUserIds: [], lobbyCountdownEndsAt: null } },
      { new: true }
    );
  }

  return DrawGameState.findOneAndUpdate(
    { _id: stateId, currentRound: null },
    {
      $set: {
        readyUserIds: [],
        lobbyCountdownEndsAt: null,
        usedWordIds: roundPayload.usedWordIds,
        currentRound: roundPayload.currentRound,
      },
    },
    { new: true }
  );
};

const syncDrawLobby = async (state: any, context: DrawGameContext) => {
  if (state.currentRound) {
    return state;
  }

  if (
    state.lobbyCountdownEndsAt &&
    getSecondsRemaining(new Date(state.lobbyCountdownEndsAt)) <= 0
  ) {
    const started = await startNewRoundAtomic(state._id as mongoose.Types.ObjectId, context);
    return started || DrawGameState.findById(state._id);
  }

  return state;
};

const syncDrawRoundTimers = async (state: any, context: DrawGameContext) => {
  if (!state?.currentRound) {
    return state;
  }

  const round = state.currentRound;

  if (round.status === 'awaiting_guesser') {
    await finalizeGuessTimeout(state);
    return DrawGameState.findById(state._id);
  }

  if (
    (round.status === 'drawing' || round.status === 'guessing') &&
    getSecondsRemaining(new Date(round.drawingDeadlineAt)) <= 0
  ) {
    await finalizeGuessTimeout(state);
    return DrawGameState.findById(state._id);
  }

  return state;
};

const startGuessingPhase = (state: any) => {
  const startedAt = new Date();
  state.currentRound.status = 'guessing';
  state.currentRound.guessingStartedAt = startedAt;
  state.currentRound.guessingDeadlineAt = new Date(
    startedAt.getTime() + DRAW_ROUND_GUESSING_SEC * 1000
  );
};

export const finishDrawingPhase = async (
  state: any,
  context: DrawGameContext,
  guesserIsOnline: boolean
) => {
  if (!state.currentRound || state.currentRound.status !== 'drawing') {
    return;
  }

  if (guesserIsOnline) {
    startGuessingPhase(state);
  } else {
    state.currentRound.status = 'awaiting_guesser';
  }

  await state.save();
};

const finalizeGuessTimeout = async (state: any) => {
  if (
    !state.currentRound ||
    (state.currentRound.status !== 'guessing' &&
      state.currentRound.status !== 'drawing' &&
      state.currentRound.status !== 'awaiting_guesser')
  ) {
    return;
  }

  state.currentRound.status = 'revealed';
  state.currentRound.wasCorrect = false;
  state.currentRound.pointsEarned = 0;
  state.currentRound.guessText = state.currentRound.guessText || null;
  state.roundsCompleted += 1;
  await state.save();
};

const finalizeCorrectGuess = async (
  state: any,
  userId: string,
  guessText: string,
  secondsTaken: number
) => {
  const word = getDrawWord(state.currentRound.wordId);
  if (!word) {
    throw new DrawGameError('WORD_NOT_FOUND', 'Слово не найдено');
  }

  const calculatedPoints = calculateDrawGuessScore(secondsTaken);
  const pointsEarned = canEarnRatingPoints(state) ? calculatedPoints : 0;

  state.currentRound.status = 'revealed';
  state.currentRound.guessText = guessText;
  state.currentRound.guessedByUserId = new mongoose.Types.ObjectId(userId);
  state.currentRound.wasCorrect = true;
  state.currentRound.pointsEarned = pointsEarned;
  state.roundsCompleted += 1;
  if (pointsEarned > 0) {
    awardRoundPoints(state, pointsEarned);
  }
  await state.save();
};

export const formatDrawGameState = (state: any, viewerUserId: string): DrawGamePublicState => {
  const rawRound = state.currentRound;
  const hideRevealFromViewer = shouldHideRevealFromViewer(rawRound, viewerUserId);
  const roundForViewer = hideRevealFromViewer ? null : rawRound;
  const allScoredRoundsDone = hasCompletedAllScoredRounds(state);
  const inLobby = !roundForViewer && !allScoredRoundsDone;
  const readyUserIds = (state.readyUserIds || []).map((id: { toString(): string }) => id.toString());
  const lobbyCountdownEndsAt = state.lobbyCountdownEndsAt
    ? new Date(state.lobbyCountdownEndsAt)
    : null;
  const waitingForPartnerResults = Boolean(
    hideRevealFromViewer && rawRound?.status === 'revealed'
  );

  let currentRound: DrawGamePublicState['currentRound'] = null;

  if (roundForViewer) {
    const round = roundForViewer;
    const word = getDrawWord(round.wordId);
    const drawerUserId = round.drawerUserId.toString();
    const isDrawer = drawerUserId === viewerUserId;
    const isGuesser = !isDrawer;

    let reveal: DrawGamePublicState['currentRound'] extends null
      ? never
      : NonNullable<DrawGamePublicState['currentRound']>['reveal'] = null;

    if (round.status === 'revealed' && word) {
      reveal = {
        word: word.label,
        guessText: round.guessText,
        wasCorrect: Boolean(round.wasCorrect),
        pointsEarned: round.pointsEarned ?? 0,
      };
    }

    currentRound = {
      wordId: round.wordId,
      drawerUserId,
      status: round.status,
      drawingSecondsRemaining: getSecondsRemaining(new Date(round.drawingDeadlineAt)),
      guessingSecondsRemaining: getSecondsRemaining(
        round.guessingDeadlineAt ? new Date(round.guessingDeadlineAt) : null
      ),
      strokes: (round.strokes || []).map((stroke: DrawStrokePublic) => ({
        points: stroke.points,
        color: stroke.color,
        width: stroke.width,
        isEraser: Boolean(stroke.isEraser),
      })),
      guessAttempts: (round.guessAttempts || []).map(
        (attempt: { userId: { toString(): string }; text: string }) => ({
          userId: attempt.userId.toString(),
          text: attempt.text,
          isOwnGuess: attempt.userId.toString() === viewerUserId,
        })
      ),
      yourWord: isDrawer && round.status === 'drawing' ? word?.label ?? null : null,
      isDrawer,
      isGuesser,
      reveal,
    };
  }

  const ratingMeta = buildDrawRatingMeta(state);

  return {
    relationshipId: state.relationshipId.toString(),
    hasPartner: true,
    totalScore: state.totalScore ?? 0,
    roundsCompleted: state.roundsCompleted ?? 0,
    scoredRoundsCompleted: state.scoredRoundsCompleted ?? 0,
    maxScoredRounds: DRAW_MAX_SCORED_ROUNDS,
    ...ratingMeta,
    roundTimeDrawingSec: DRAW_ROUND_DRAWING_SEC,
    roundTimeGuessingSec: DRAW_ROUND_GUESSING_SEC,
    inLobby,
    lobbyCountdownSec: DRAW_LOBBY_COUNTDOWN_SEC,
    readyUserIds,
    lobbySecondsRemaining: lobbyCountdownEndsAt
      ? getSecondsRemaining(lobbyCountdownEndsAt)
      : 0,
    waitingForPartnerResults,
    allScoredRoundsDone,
    currentRound,
  };
};

export const getOrCreateDrawGameState = async (context: DrawGameContext, viewerUserId: string) => {
  const relationshipId = context.relationship._id;
  let state = await DrawGameState.findOne({ relationshipId });

  if (!state) {
    try {
      state = await DrawGameState.create({
        relationshipId,
        totalScore: 0,
        roundsCompleted: 0,
        scoredRoundsCompleted: 0,
        scoredRoundsDayKey: getUtcDayKey(),
        scoredRoundsToday: 0,
        usedWordIds: [],
        readyUserIds: [],
        lobbyCountdownEndsAt: null,
        currentRound: null,
      });
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }
      state = await DrawGameState.findOne({ relationshipId });
    }
  }

  if (!state) {
    throw new DrawGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  const syncedTimers = await syncDrawRoundTimers(state, context);
  if (!syncedTimers) {
    throw new DrawGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  const syncedLobby = await syncDrawLobby(syncedTimers, context);
  if (!syncedLobby) {
    throw new DrawGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  return { state: syncedLobby, publicState: formatDrawGameState(syncedLobby, viewerUserId) };
};

export const setDrawPlayerReady = async (userId: string, context: DrawGameContext) => {
  const { state: initialState } = await getOrCreateDrawGameState(context, userId);
  let state = initialState;

  if (
    state.currentRound &&
    state.currentRound.status !== 'revealed'
  ) {
    throw new DrawGameError('ROUND_ALREADY_ACTIVE', 'Раунд уже идёт');
  }

  if (
    state.currentRound?.status === 'revealed' &&
    !hasUserDismissedReveal(state.currentRound, userId)
  ) {
    throw new DrawGameError(
      'VIEW_RESULTS_FIRST',
      'Сначала нажмите «Завершить» или «Следующий раунд» на экране результатов'
    );
  }

  const participantIds = getDrawGameParticipantIds(context);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const readyFilter: Record<string, unknown> = { _id: state._id };

  if (!state.currentRound) {
    readyFilter.currentRound = null;
  } else {
    readyFilter['currentRound.status'] = 'revealed';
    readyFilter['currentRound.dismissedRevealUserIds'] = userObjectId;
  }

  const withReady = await DrawGameState.findOneAndUpdate(
    readyFilter,
    { $addToSet: { readyUserIds: userObjectId } },
    { new: true }
  );

  if (!withReady) {
    state = await DrawGameState.findById(state._id);
    if (!state) {
      throw new DrawGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
    }
    if (state.currentRound && state.currentRound.status !== 'revealed') {
      throw new DrawGameError('ROUND_ALREADY_ACTIVE', 'Раунд уже идёт');
    }
    if (
      state.currentRound?.status === 'revealed' &&
      !hasUserDismissedReveal(state.currentRound, userId)
    ) {
      throw new DrawGameError(
        'VIEW_RESULTS_FIRST',
        'Сначала нажмите «Завершить» или «Следующий раунд» на экране результатов'
      );
    }
  } else {
    state = withReady;
  }

  state = await startLobbyCountdownIfAllReady(state, participantIds);
  const syncedLobby = await syncDrawLobby(state, context);
  if (!syncedLobby) {
    throw new DrawGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  return { state: syncedLobby, publicState: formatDrawGameState(syncedLobby, userId) };
};

export const appendDrawStroke = async (
  userId: string,
  context: DrawGameContext,
  stroke: DrawStrokePublic
) => {
  const state = await DrawGameState.findOne({ relationshipId: context.relationship._id });
  if (!state?.currentRound || state.currentRound.status !== 'drawing') {
    throw new DrawGameError('NOT_DRAWING', 'Сейчас нельзя рисовать');
  }

  if (state.currentRound.drawerUserId.toString() !== userId) {
    throw new DrawGameError('NOT_DRAWER', 'Рисовать может только художник');
  }

  if ((state.currentRound.strokes || []).length >= 400) {
    throw new DrawGameError('TOO_MANY_STROKES', 'Достигнут лимит штрихов за раунд');
  }

  if (!Array.isArray(state.currentRound.strokes)) {
    state.currentRound.strokes = [];
  }

  state.currentRound.strokes.push({
    points: stroke.points,
    color: stroke.color,
    width: stroke.width,
    isEraser: Boolean(stroke.isEraser),
  });

  await state.save();
  return state;
};

export const submitDrawFinishDrawing = async (
  userId: string,
  context: DrawGameContext,
  guesserIsOnline: boolean
) => {
  const state = await DrawGameState.findOne({ relationshipId: context.relationship._id });
  if (!state?.currentRound || state.currentRound.status !== 'drawing') {
    throw new DrawGameError('NOT_DRAWING', 'Фаза рисования уже завершена');
  }

  if (state.currentRound.drawerUserId.toString() !== userId) {
    throw new DrawGameError('NOT_DRAWER', 'Завершить рисование может только художник');
  }

  await finishDrawingPhase(state, context, guesserIsOnline);
  const freshState = await DrawGameState.findById(state._id);
  if (!freshState) {
    throw new DrawGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  return freshState;
};

const appendDrawGuessAttempt = (state: any, userId: string, text: string) => {
  if (!state.currentRound) {
    return;
  }

  if (!Array.isArray(state.currentRound.guessAttempts)) {
    state.currentRound.guessAttempts = [];
  }

  if (state.currentRound.guessAttempts.length >= DRAW_MAX_GUESS_ATTEMPTS_PER_ROUND) {
    throw new DrawGameError('TOO_MANY_GUESSES', 'Слишком много попыток за раунд');
  }

  state.currentRound.guessAttempts.push({
    userId: new mongoose.Types.ObjectId(userId),
    text: text.slice(0, 80),
    createdAt: new Date(),
  });
};

export const clearDrawGuessAttempts = async (context: DrawGameContext) => {
  const state = await DrawGameState.findOne({ relationshipId: context.relationship._id });
  if (!state?.currentRound) {
    return state;
  }

  state.currentRound.guessAttempts = [];
  await state.save();
  return state;
};

export const joinDrawGuessing = async (userId: string, context: DrawGameContext) => {
  const state = await DrawGameState.findOne({ relationshipId: context.relationship._id });
  if (!state?.currentRound) {
    throw new DrawGameError('NO_ROUND', 'Нет активного раунда');
  }

  const round = state.currentRound;
  const drawerUserId = round.drawerUserId.toString();

  if (userId === drawerUserId) {
    return state;
  }

  if (round.status === 'awaiting_guesser') {
    startGuessingPhase(state);
    await state.save();
  }

  return DrawGameState.findById(state._id);
};

export const submitDrawGuess = async (userId: string, context: DrawGameContext, guess: string) => {
  const trimmed = guess.trim();
  if (!trimmed) {
    throw new DrawGameError('EMPTY_GUESS', 'Введите ответ');
  }

  let state = await DrawGameState.findOne({ relationshipId: context.relationship._id });
  if (!state?.currentRound) {
    throw new DrawGameError('NO_ROUND', 'Нет активного раунда');
  }

  if (state.currentRound.drawerUserId.toString() === userId) {
    throw new DrawGameError('NOT_GUESSER', 'Угадывает только партнёр');
  }

  const roundStatus = state.currentRound.status;
  if (roundStatus !== 'drawing' && roundStatus !== 'guessing') {
    throw new DrawGameError('NOT_GUESSING', 'Сейчас нельзя отправить ответ');
  }

  const drawingDeadlineAt = state.currentRound.drawingDeadlineAt;
  if (getSecondsRemaining(new Date(drawingDeadlineAt)) <= 0) {
    await finalizeGuessTimeout(state);
    throw new DrawGameError('GUESS_EXPIRED', 'Время на ответ истекло');
  }

  const word = getDrawWord(state.currentRound.wordId);
  if (!word) {
    throw new DrawGameError('WORD_NOT_FOUND', 'Слово не найдено');
  }

  if (!isDrawGuessCorrect(trimmed, word)) {
    appendDrawGuessAttempt(state, userId, trimmed);
    await state.save();
    return DrawGameState.findById(state._id);
  }

  const secondsTaken = Math.max(
    0,
    DRAW_ROUND_DRAWING_SEC - getSecondsRemaining(new Date(drawingDeadlineAt))
  );

  await finalizeCorrectGuess(state, userId, trimmed, secondsTaken);

  return DrawGameState.findById(state._id);
};

export const advanceDrawRound = async (userId: string, context: DrawGameContext) => {
  const state = await DrawGameState.findOne({ relationshipId: context.relationship._id });

  if (!state?.currentRound || state.currentRound.status !== 'revealed') {
    throw new DrawGameError('ROUND_NOT_REVEALED', 'Сначала завершите текущий раунд');
  }

  const participantIds = getDrawGameParticipantIds(context);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  if (!Array.isArray(state.currentRound.dismissedRevealUserIds)) {
    state.currentRound.dismissedRevealUserIds = [];
  }

  const alreadyDismissed = state.currentRound.dismissedRevealUserIds.some(
    (id: { toString(): string }) => id.toString() === userId
  );

  if (!alreadyDismissed) {
    state.currentRound.dismissedRevealUserIds.push(userObjectId);
  }

  const allPartnersDismissed = participantIds.every((participantId) =>
    state.currentRound!.dismissedRevealUserIds.some(
      (id: { toString(): string }) => id.toString() === participantId
    )
  );

  if (!allPartnersDismissed) {
    await state.save();
    return { state, allPartnersDismissed: false };
  }

  state.currentRound = null;
  state.lobbyCountdownEndsAt = null;
  await state.save();

  let synced = await syncDrawLobby(state, context);
  if (!synced) {
    throw new DrawGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  synced = await startLobbyCountdownIfAllReady(synced, participantIds);
  synced = (await syncDrawLobby(synced, context)) || synced;

  return { state: synced, allPartnersDismissed: true };
};

export const getDrawGameParticipantIds = (context: DrawGameContext): string[] => [
  context.relationship.userId.toString(),
  context.relationship.partnerId.toString(),
];

export const getDrawLeaderboard = async (limit = 50) => {
  const entries = await DrawGameState.find({ totalScore: { $gt: 0 } })
    .sort({ totalScore: -1 })
    .limit(limit)
    .lean();

  const pairBest = new Map<string, { relationshipId: string; totalScore: number }>();

  await Promise.all(
    entries.map(async (entry) => {
      const relationship = await Relationship.findById(entry.relationshipId).select(
        'userId partnerId'
      );
      if (!relationship) {
        return;
      }

      const pairKey = [relationship.userId.toString(), relationship.partnerId.toString()]
        .sort()
        .join(':');
      const candidate = {
        relationshipId: entry.relationshipId!.toString(),
        totalScore: entry.totalScore ?? 0,
      };

      const existing = pairBest.get(pairKey);
      if (!existing || candidate.totalScore > existing.totalScore) {
        pairBest.set(pairKey, candidate);
      }
    })
  );

  const rankedRows = [...pairBest.values()]
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);

  const results = await Promise.all(
    rankedRows.map(async (entry, index) => {
      const relationship = await Relationship.findById(entry.relationshipId);
      if (!relationship) {
        return null;
      }

      const [user, partner] = await Promise.all([
        User.findById(relationship.userId).select('username firstName lastName avatar'),
        User.findById(relationship.partnerId).select('username firstName lastName avatar'),
      ]);

      if (!user || !partner) {
        return null;
      }

      return {
        rank: index + 1,
        relationshipId: entry.relationshipId,
        totalScore: entry.totalScore,
        users: [
          {
            id: user._id.toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          },
          {
            id: partner._id.toString(),
            username: partner.username,
            firstName: partner.firstName,
            lastName: partner.lastName,
            avatar: partner.avatar,
          },
        ],
      };
    })
  );

  return results
    .filter(Boolean)
    .map((entry, index) => ({ ...entry!, rank: index + 1 }));
};

export const updateDrawGameBadges = async () => {
  const topPairs = await DrawGameState.find({ totalScore: { $gt: 0 } })
    .sort({ totalScore: -1 })
    .limit(10)
    .lean();

  const pairBest = new Map<string, { relationshipId: string; totalScore: number }>();

  await Promise.all(
    topPairs.map(async (entry) => {
      const relationship = await Relationship.findById(entry.relationshipId).select(
        'userId partnerId'
      );
      if (!relationship) {
        return;
      }

      const pairKey = [relationship.userId.toString(), relationship.partnerId.toString()]
        .sort()
        .join(':');
      const candidate = {
        relationshipId: entry.relationshipId!.toString(),
        totalScore: entry.totalScore ?? 0,
      };

      const existing = pairBest.get(pairKey);
      if (!existing || candidate.totalScore > existing.totalScore) {
        pairBest.set(pairKey, candidate);
      }
    })
  );

  const ranked = [...pairBest.values()].sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);

  await Relationship.updateMany(
    { 'badges.gameId': 'draw' },
    { $pull: { badges: { gameId: 'draw' } } }
  );

  const assignedRelationshipIds = new Set<string>();

  await Promise.all(
    ranked.map(async (entry, index) => {
      if (assignedRelationshipIds.has(entry.relationshipId)) {
        return;
      }
      assignedRelationshipIds.add(entry.relationshipId);

      await Relationship.findByIdAndUpdate(entry.relationshipId, {
        $push: {
          badges: {
            gameId: 'draw',
            rank: index + 1,
            updatedAt: new Date(),
          },
        },
      });
    })
  );
};

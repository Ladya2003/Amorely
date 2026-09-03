import mongoose from 'mongoose';
import Relationship from '../models/relationship';
import User from '../models/user';
import QuizGameState from '../models/quizGameState';
import { requireActiveRelationship } from '../utils/requireActiveRelationship';
import { getNextUtcMidnight, getUtcDayKey } from '../utils/dailyReset';
import {
  QUIZ_CONTENT_VERSION,
  QUIZ_LOBBY_COUNTDOWN_SEC,
  QUIZ_QUESTION_TIME_SEC,
  buildDailyBoard,
  getQuizCellKey,
  getQuizQuestionById,
  getShuffledQuizOptionIds,
  isQuizOptionCorrect,
  isQuizOptionId,
  type QuizOptionId,
} from './quizGameConfig';
import { awardGameDailyCompleteToParticipants, GAME_DAILY_COMPLETE_AMOUNTS } from './gameCurrencyAwards';
import {
  getQuizCategoryName,
  getQuizCorrectAnswer,
  getQuizOptionText,
  getQuizQuestionText,
} from '../i18n/quizI18n';
import { AppLocale } from '../i18n/locales';
import { getUserLocale } from '../utils/userLocale';

export interface QuizGameRelationship {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;
}

export interface QuizGameContext {
  relationship: QuizGameRelationship;
  ownerUserId: string;
  partnerUserId: string;
}

export interface QuizAnswerPublic {
  userId: string;
  text: string;
  isCorrect: boolean;
  pointsEarned: number;
  submitted: boolean;
}

export interface QuizQuestionRevealPublic {
  cellKey: string;
  categoryId: string;
  points: number;
  questionText: string;
  correctAnswer: string;
  correctOptionId: string;
  answers: QuizAnswerPublic[];
  pointsAwardedTotal: number;
  secondsRemaining: number;
}

export interface QuizBoardCellPublic {
  cellKey: string;
  categoryId: string;
  categoryName: string;
  points: number;
  used: boolean;
}

export interface QuizGamePublicState {
  relationshipId: string;
  hasPartner: true;
  totalScore: number;
  questionTimeSec: number;
  inLobby: boolean;
  lobbyCountdownSec: number;
  readyUserIds: string[];
  lobbySecondsRemaining: number;
  sessionActive: boolean;
  onCooldown: boolean;
  cooldownSecondsRemaining: number;
  nextBoardAvailableAt: string | null;
  boardCells: QuizBoardCellPublic[];
  cellsRemaining: number;
  isMyTurnToPick: boolean;
  currentQuestion: {
    cellKey: string;
    categoryId: string;
    categoryName: string;
    points: number;
    questionText: string;
    options: Array<{ id: string; text: string }>;
    status: 'answering' | 'revealed';
    secondsRemaining: number;
    myOptionId: string | null;
    myAnswerSubmitted: boolean;
    partnerOptionId: string | null;
    partnerAnswerSubmitted: boolean;
    reveal: QuizQuestionRevealPublic | null;
  } | null;
}

export class QuizGameError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const getSecondsRemaining = (deadlineAt: Date) =>
  Math.max(0, Math.ceil((deadlineAt.getTime() - Date.now()) / 1000));

const getUniqueParticipantIds = (context: QuizGameContext) => [
  context.relationship.userId.toString(),
  context.relationship.partnerId.toString(),
];

const getOtherParticipantId = (participantIds: string[], currentId: string) =>
  participantIds.find((id) => id !== currentId) ?? participantIds[0];

const pickRandomParticipantId = (participantIds: string[]) =>
  participantIds[Math.floor(Math.random() * participantIds.length)];

export const resolveQuizGameContext = async (userId: string): Promise<QuizGameContext> => {
  const relationshipContext = await requireActiveRelationship(userId);

  if (!relationshipContext) {
    throw new QuizGameError(
      'NO_PARTNER',
      'Для игры нужен партнёр. Добавьте его в настройках профиля.'
    );
  }

  const { relationship } = relationshipContext;

  return {
    relationship: {
      _id: relationship._id,
      userId: relationship.userId,
      partnerId: relationship.partnerId,
    },
    ownerUserId: relationship.userId.toString(),
    partnerUserId: relationship.partnerId.toString(),
  };
};

const getBoardDayKey = () => getUtcDayKey();

const normalizeQuizCooldownToUtcMidnight = (state: any) => {
  if (!state.nextBoardAvailableAt || state.nextBoardAvailableAt.getTime() <= Date.now()) {
    return;
  }
  state.nextBoardAvailableAt = getNextUtcMidnight();
};

const syncBoardDayIfExpired = (state: any): boolean => {
  const today = getBoardDayKey();
  if (!state.boardDayKey || state.boardDayKey === today || isOnCooldown(state)) {
    return false;
  }

  state.boardDayKey = null;
  state.boardCells = [];
  state.usedCellKeys = [];
  state.sessionActive = false;
  state.currentQuestion = null;
  state.readyUserIds = [];
  state.lobbyCountdownEndsAt = null;
  state.pickerUserId = null;
  return true;
};

const isOnCooldown = (state: any) =>
  Boolean(state.nextBoardAvailableAt && state.nextBoardAvailableAt.getTime() > Date.now());

const getCooldownSecondsRemaining = (state: any) => {
  if (!state.nextBoardAvailableAt) {
    return 0;
  }
  return Math.max(0, Math.ceil((state.nextBoardAvailableAt.getTime() - Date.now()) / 1000));
};

const markCellUsed = (state: any, cellKey: string) => {
  if (!state.usedCellKeys.includes(cellKey)) {
    state.usedCellKeys.push(cellKey);
  }
  state.boardCells = (state.boardCells || []).map((cell: any) => ({
    ...(cell.toObject?.() ?? cell),
    used: cell.cellKey === cellKey ? true : Boolean(cell.used),
  }));
};

const markQuestionSeen = (state: any, questionId: string) => {
  if (!questionId) {
    return;
  }

  if (!Array.isArray(state.seenQuestionIds)) {
    state.seenQuestionIds = [];
  }

  if (!state.seenQuestionIds.includes(questionId)) {
    state.seenQuestionIds.push(questionId);
  }
};

const allCellsUsed = (state: any) => {
  const cells = state.boardCells || [];
  return cells.length > 0 && cells.every((cell: any) => cell.used || state.usedCellKeys.includes(cell.cellKey));
};

const finishBoardIfComplete = (state: any) => {
  if (!allCellsUsed(state)) {
    return;
  }
  state.sessionActive = false;
  state.currentQuestion = null;
  state.readyUserIds = [];
  state.lobbyCountdownEndsAt = null;
  state.pickerUserId = null;
  state.nextBoardAvailableAt = getNextUtcMidnight();
};

const initializeBoardSession = (state: any, participantIds: string[]) => {
  const boardDayKey = getBoardDayKey();
  const relationshipId = state.relationshipId.toString();
  const { cells, didResetSeenPool } = buildDailyBoard(
    boardDayKey,
    relationshipId,
    state.seenQuestionIds || []
  );

  state.boardDayKey = boardDayKey;
  state.boardCells = cells;
  state.usedCellKeys = [];
  state.sessionActive = true;
  state.nextBoardAvailableAt = null;
  state.currentQuestion = null;
  state.pickerUserId = new mongoose.Types.ObjectId(pickRandomParticipantId(participantIds));

  if (didResetSeenPool) {
    state.seenQuestionIds = [];
  }
};

const clearCooldownIfExpired = (state: any): boolean => {
  normalizeQuizCooldownToUtcMidnight(state);

  if (state.nextBoardAvailableAt && state.nextBoardAvailableAt.getTime() <= Date.now()) {
    state.nextBoardAvailableAt = null;
    state.boardDayKey = null;
    state.boardCells = [];
    state.usedCellKeys = [];
    state.sessionActive = false;
    state.currentQuestion = null;
    state.readyUserIds = [];
    state.lobbyCountdownEndsAt = null;
    state.pickerUserId = null;
    return true;
  }

  return false;
};

const resolveQuestionOnDocument = (state: any, participantIds: string[]) => {
  const round = state.currentQuestion;
  if (!round || round.status !== 'answering') {
    return;
  }

  const configQuestion = getQuizQuestionById(round.questionId);
  if (!configQuestion) {
    markCellUsed(state, round.cellKey);
    markQuestionSeen(state, round.questionId);
    state.currentQuestion = null;
    return;
  }

  const answeredIds = new Set(
    (round.answers || []).map((entry: { userId: { toString(): string } }) => entry.userId.toString())
  );

  for (const participantId of participantIds) {
    if (!answeredIds.has(participantId)) {
      round.answers.push({
        userId: new mongoose.Types.ObjectId(participantId),
        text: '',
        isCorrect: false,
        pointsEarned: 0,
      });
    }
  }

  let pointsAwardedTotal = 0;
  round.answers = round.answers.map(
    (entry: { userId: mongoose.Types.ObjectId; text: string; isCorrect?: boolean; pointsEarned?: number }) => {
      const isCorrect = entry.text ? isQuizOptionCorrect(configQuestion, entry.text) : false;
      const pointsEarned = isCorrect ? round.points : 0;
      pointsAwardedTotal += pointsEarned;
      return {
        userId: entry.userId,
        text: entry.text,
        isCorrect,
        pointsEarned,
      };
    }
  );

  round.pointsAwardedTotal = pointsAwardedTotal;
  round.status = 'revealed';
  state.totalScore += pointsAwardedTotal;
  markCellUsed(state, round.cellKey);
  markQuestionSeen(state, round.questionId);
};

const maybeAwardQuizDailyComplete = async (state: any, context: QuizGameContext) => {
  if (!allCellsUsed(state) || !state.boardDayKey) {
    return;
  }

  const relationshipId = context.relationship._id.toString();
  const dayKey = `${relationshipId}:${state.boardDayKey}`;
  await awardGameDailyCompleteToParticipants(
    getUniqueParticipantIds(context),
    'quiz',
    dayKey,
    GAME_DAILY_COMPLETE_AMOUNTS.quiz
  );
};

const serializeCurrentQuestion = (question: any) => {
  const raw = typeof question.toObject === 'function' ? question.toObject() : { ...question };
  return {
    ...raw,
    answers: (raw.answers || []).map(
      (entry: { userId: unknown; text: string; isCorrect: boolean; pointsEarned: number }) => ({
        userId: entry.userId,
        text: entry.text,
        isCorrect: entry.isCorrect,
        pointsEarned: entry.pointsEarned,
      })
    ),
  };
};

const persistResolvedQuestion = async (state: any, cellKey: string) => {
  const question = state.currentQuestion;
  const filter = {
    _id: state._id,
    'currentQuestion.status': 'answering',
    'currentQuestion.cellKey': cellKey,
  };

  if (!question) {
    return QuizGameState.findOneAndUpdate(
      filter,
      {
        $set: {
          currentQuestion: null,
          boardCells: state.boardCells,
          usedCellKeys: state.usedCellKeys,
          seenQuestionIds: state.seenQuestionIds,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  return QuizGameState.findOneAndUpdate(
    filter,
    {
      $set: {
        currentQuestion: serializeCurrentQuestion(question),
        totalScore: state.totalScore,
        boardCells: state.boardCells,
        usedCellKeys: state.usedCellKeys,
        seenQuestionIds: state.seenQuestionIds,
        updatedAt: new Date(),
      },
    },
    { new: true }
  );
};

const resolveQuestionAndMaybeAwardDaily = async (state: any, context: QuizGameContext) => {
  const round = state.currentQuestion;
  if (!round || round.status !== 'answering') {
    return null;
  }

  const cellKey = round.cellKey;
  resolveQuestionOnDocument(state, getUniqueParticipantIds(context));
  const persisted = await persistResolvedQuestion(state, cellKey);
  if (persisted) {
    await maybeAwardQuizDailyComplete(persisted, context);
  }
  return persisted;
};

export const expireQuizQuestionIfNeeded = async (state: any, context: QuizGameContext): Promise<boolean> => {
  if (!state.currentQuestion || state.currentQuestion.status !== 'answering') {
    return false;
  }

  if (getSecondsRemaining(new Date(state.currentQuestion.deadlineAt)) > 0) {
    const participantIds = getUniqueParticipantIds(context);
    const answeredIds = new Set(
      (state.currentQuestion.answers || []).map((entry: { userId: { toString(): string } }) =>
        entry.userId.toString()
      )
    );
    if (participantIds.some((participantId) => !answeredIds.has(participantId))) {
      return false;
    }
  }

  const persisted = await resolveQuestionAndMaybeAwardDaily(state, context);
  return Boolean(persisted);
};

const syncQuizLobby = async (state: any, context?: QuizGameContext) => {
  let dirty = clearCooldownIfExpired(state);
  dirty = syncBoardDayIfExpired(state) || dirty;

  if (isOnCooldown(state)) {
    state.sessionActive = false;
    state.currentQuestion = null;
    state.readyUserIds = [];
    state.lobbyCountdownEndsAt = null;
    state.pickerUserId = null;
    await state.save();
    return state;
  }

  if (state.sessionActive) {
    if (dirty) {
      await state.save();
    }
    return state;
  }

  if (
    state.lobbyCountdownEndsAt &&
    getSecondsRemaining(new Date(state.lobbyCountdownEndsAt)) <= 0
  ) {
    state.readyUserIds = [];
    state.lobbyCountdownEndsAt = null;
    if (context) {
      initializeBoardSession(state, getUniqueParticipantIds(context));
    } else {
      const relationship = await Relationship.findById(state.relationshipId).select('userId partnerId');
      if (relationship) {
        initializeBoardSession(state, [
          relationship.userId.toString(),
          relationship.partnerId.toString(),
        ]);
      }
    }
    await state.save();
    return state;
  }

  if (dirty) {
    await state.save();
  }

  return state;
};

export const formatQuizGameState = (
  state: any,
  viewerUserId: string,
  viewerLocale: AppLocale = 'ru'
): QuizGamePublicState => {
  const onCooldown = isOnCooldown(state);
  const inLobby = !onCooldown && !state.sessionActive && !state.currentQuestion;
  const lobbyCountdownEndsAt = state.lobbyCountdownEndsAt
    ? new Date(state.lobbyCountdownEndsAt)
    : null;

  const boardCells: QuizBoardCellPublic[] = (state.boardCells || []).map((cell: any) => ({
    cellKey: cell.cellKey,
    categoryId: cell.categoryId,
    categoryName: getQuizCategoryName(cell.categoryId, cell.categoryName, viewerLocale),
    points: cell.points,
    used: Boolean(cell.used) || (state.usedCellKeys || []).includes(cell.cellKey),
  }));

  const cellsRemaining = boardCells.filter((cell) => !cell.used).length;

  let currentQuestion: QuizGamePublicState['currentQuestion'] = null;
  if (state.currentQuestion) {
    const configQuestion = getQuizQuestionById(state.currentQuestion.questionId);
    const storedCategoryName =
      (state.boardCells || []).find(
        (cell: { categoryId: string; categoryName: string }) =>
          cell.categoryId === state.currentQuestion.categoryId
      )?.categoryName || state.currentQuestion.categoryId;
    const categoryName = getQuizCategoryName(
      state.currentQuestion.categoryId,
      storedCategoryName,
      viewerLocale
    );
    const localizedQuestionText = configQuestion
      ? getQuizQuestionText(configQuestion, viewerLocale)
      : '';
    const optionIds = ((state.currentQuestion.optionIds || []) as string[]).filter(isQuizOptionId);
    const localizedOptions = configQuestion
      ? optionIds.map((optionId: QuizOptionId) => ({
          id: optionId,
          text: getQuizOptionText(configQuestion, optionId, viewerLocale),
        }))
      : [];

    const myAnswer = state.currentQuestion.answers?.find(
      (entry: { userId: { toString(): string } }) => entry.userId.toString() === viewerUserId
    );
    const partnerAnswer = state.currentQuestion.answers?.find(
      (entry: { userId: { toString(): string } }) => entry.userId.toString() !== viewerUserId
    );

    const reveal =
      state.currentQuestion.status === 'revealed'
        ? {
            cellKey: state.currentQuestion.cellKey,
            categoryId: state.currentQuestion.categoryId,
            points: state.currentQuestion.points,
            questionText: localizedQuestionText,
            correctAnswer: configQuestion
              ? getQuizCorrectAnswer(configQuestion, viewerLocale)
              : '',
            correctOptionId: configQuestion?.correctId ?? '',
            answers: (state.currentQuestion.answers || []).map(
              (entry: {
                userId: { toString(): string };
                text: string;
                isCorrect: boolean;
                pointsEarned: number;
              }) => ({
                userId: entry.userId.toString(),
                text:
                  entry.text && configQuestion && isQuizOptionId(entry.text)
                    ? getQuizOptionText(configQuestion, entry.text, viewerLocale)
                    : '',
                isCorrect: entry.isCorrect,
                pointsEarned: entry.pointsEarned,
                submitted: Boolean(entry.text),
              })
            ),
            pointsAwardedTotal: state.currentQuestion.pointsAwardedTotal ?? 0,
            secondsRemaining: 0,
          }
        : null;

    currentQuestion = {
      cellKey: state.currentQuestion.cellKey,
      categoryId: state.currentQuestion.categoryId,
      categoryName,
      points: state.currentQuestion.points,
      questionText: localizedQuestionText,
      options: localizedOptions,
      status: state.currentQuestion.status,
      secondsRemaining:
        state.currentQuestion.status === 'answering'
          ? getSecondsRemaining(new Date(state.currentQuestion.deadlineAt))
          : 0,
      myOptionId: myAnswer?.text && isQuizOptionId(myAnswer.text) ? myAnswer.text : null,
      myAnswerSubmitted: Boolean(myAnswer?.text),
      partnerOptionId:
        partnerAnswer?.text && isQuizOptionId(partnerAnswer.text) ? partnerAnswer.text : null,
      partnerAnswerSubmitted: Boolean(partnerAnswer?.text),
      reveal,
    };
  }

  return {
    relationshipId: state.relationshipId.toString(),
    hasPartner: true,
    totalScore: state.totalScore ?? 0,
    questionTimeSec: QUIZ_QUESTION_TIME_SEC,
    inLobby,
    lobbyCountdownSec: QUIZ_LOBBY_COUNTDOWN_SEC,
    readyUserIds: (state.readyUserIds || []).map((id: { toString(): string }) => id.toString()),
    lobbySecondsRemaining: lobbyCountdownEndsAt ? getSecondsRemaining(lobbyCountdownEndsAt) : 0,
    sessionActive: Boolean(state.sessionActive) && !onCooldown,
    onCooldown,
    cooldownSecondsRemaining: getCooldownSecondsRemaining(state),
    nextBoardAvailableAt: state.nextBoardAvailableAt
      ? new Date(state.nextBoardAvailableAt).toISOString()
      : null,
    boardCells,
    cellsRemaining,
    isMyTurnToPick:
      Boolean(state.sessionActive) &&
      !onCooldown &&
      !state.currentQuestion &&
      state.pickerUserId?.toString() === viewerUserId,
    currentQuestion,
  };
};

export const getOrCreateQuizGameState = async (context: QuizGameContext) => {
  const relationshipId = context.relationship._id;
  let state = await QuizGameState.findOne({ relationshipId });

  if (!state) {
    try {
      state = await QuizGameState.create({
        relationshipId,
        contentVersion: QUIZ_CONTENT_VERSION,
        totalScore: 0,
        boardDayKey: null,
        boardCells: [],
        usedCellKeys: [],
        seenQuestionIds: [],
        readyUserIds: [],
        lobbyCountdownEndsAt: null,
        sessionActive: false,
        pickerUserId: null,
        nextBoardAvailableAt: null,
        currentQuestion: null,
      });
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }
      state = await QuizGameState.findOne({ relationshipId });
    }
  }

  if (!state) {
    throw new QuizGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  if (state.contentVersion !== QUIZ_CONTENT_VERSION) {
    state.contentVersion = QUIZ_CONTENT_VERSION;
    state.boardDayKey = null;
    state.boardCells = [];
    state.usedCellKeys = [];
    state.seenQuestionIds = [];
    state.readyUserIds = [];
    state.lobbyCountdownEndsAt = null;
    state.sessionActive = false;
    state.pickerUserId = null;
    state.currentQuestion = null;
    await state.save();
  } else if (
    state.currentQuestion &&
    (!Array.isArray(state.currentQuestion.optionIds) ||
      state.currentQuestion.optionIds.length === 0 ||
      !getQuizQuestionById(state.currentQuestion.questionId))
  ) {
    state.currentQuestion = null;
    await state.save();
  }

  await expireQuizQuestionIfNeeded(state, context);
  const refreshed = await QuizGameState.findById(state._id);
  if (!refreshed) {
    throw new QuizGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  if (refreshed.sessionActive && !refreshed.pickerUserId && !isOnCooldown(refreshed)) {
    refreshed.pickerUserId = new mongoose.Types.ObjectId(
      pickRandomParticipantId(getUniqueParticipantIds(context))
    );
    await refreshed.save();
  }

  return syncQuizLobby(refreshed, context);
};

export const setQuizPlayerReady = async (userId: string, context: QuizGameContext) => {
  let state = await getOrCreateQuizGameState(context);

  if (state.sessionActive || state.currentQuestion) {
    throw new QuizGameError('SESSION_ALREADY_ACTIVE', 'Игра уже идёт');
  }

  if (isOnCooldown(state)) {
    throw new QuizGameError('ON_COOLDOWN', 'Новое поле будет доступно после паузы');
  }

  const participantIds = getUniqueParticipantIds(context);

  const withReady = await QuizGameState.findOneAndUpdate(
    {
      _id: state._id,
      sessionActive: false,
      currentQuestion: null,
      $or: [{ nextBoardAvailableAt: null }, { nextBoardAvailableAt: { $lte: new Date() } }],
    },
    { $addToSet: { readyUserIds: new mongoose.Types.ObjectId(userId) } },
    { new: true }
  );

  if (!withReady) {
    state = await QuizGameState.findById(state._id);
    if (!state) {
      throw new QuizGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
    }
  } else {
    state = withReady;
  }

  const readyIds = new Set<string>(
    (state.readyUserIds || []).map((id: { toString(): string }) => id.toString())
  );
  const allReady = participantIds.every((participantId) => readyIds.has(participantId));

  if (allReady && !state.lobbyCountdownEndsAt) {
    const countdownEndsAt = new Date(Date.now() + QUIZ_LOBBY_COUNTDOWN_SEC * 1000);
    const withCountdown = await QuizGameState.findOneAndUpdate(
      {
        _id: state._id,
        sessionActive: false,
        lobbyCountdownEndsAt: null,
      },
      { $set: { lobbyCountdownEndsAt: countdownEndsAt } },
      { new: true }
    );
    if (withCountdown) {
      state = withCountdown;
    }
  }

  return syncQuizLobby(state, context);
};

export const pickQuizQuestion = async (
  userId: string,
  context: QuizGameContext,
  categoryId: string,
  points: number
) => {
  const state = await getOrCreateQuizGameState(context);

  if (!state.sessionActive || isOnCooldown(state)) {
    throw new QuizGameError('SESSION_NOT_ACTIVE', 'Сначала начните игру с партнёром');
  }

  if (state.currentQuestion) {
    return state;
  }

  if (!state.pickerUserId || state.pickerUserId.toString() !== userId) {
    throw new QuizGameError('NOT_YOUR_TURN', 'Сейчас ход вашего партнёра');
  }

  const cellKey = getQuizCellKey(categoryId, points);
  const cell = (state.boardCells || []).find((item: any) => item.cellKey === cellKey);

  if (!cell || cell.used || (state.usedCellKeys || []).includes(cellKey)) {
    throw new QuizGameError('CELL_NOT_AVAILABLE', 'Этот вопрос уже сыгран');
  }

  const configQuestion = getQuizQuestionById(cell.questionId);
  if (!configQuestion) {
    throw new QuizGameError('QUESTION_NOT_FOUND', 'Вопрос не найден');
  }

  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + QUIZ_QUESTION_TIME_SEC * 1000);
  const optionIds = getShuffledQuizOptionIds(
    configQuestion,
    `options:${context.relationship._id}:${cell.questionId}`
  );

  const updated = await QuizGameState.findOneAndUpdate(
    {
      _id: state._id,
      sessionActive: true,
      currentQuestion: null,
      pickerUserId: new mongoose.Types.ObjectId(userId),
      usedCellKeys: { $nin: [cellKey] },
    },
    {
      $set: {
        currentQuestion: {
          cellKey,
          categoryId,
          points,
          questionId: cell.questionId,
          optionIds,
          startedAt,
          deadlineAt,
          status: 'answering',
          answers: [],
          pointsAwardedTotal: 0,
        },
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new QuizGameError('CELL_NOT_AVAILABLE', 'Этот вопрос уже занят или сыгран');
  }

  return updated;
};

export const submitQuizAnswer = async (userId: string, context: QuizGameContext, answerText: string) => {
  const trimmed = answerText.trim();
  if (!isQuizOptionId(trimmed)) {
    throw new QuizGameError('EMPTY_ANSWER', 'Выберите один из вариантов');
  }

  let state = await QuizGameState.findOne({ relationshipId: context.relationship._id });
  if (!state) {
    throw new QuizGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }

  await expireQuizQuestionIfNeeded(state, context);
  state = (await QuizGameState.findById(state._id))!;

  if (!state.currentQuestion || state.currentQuestion.status !== 'answering') {
    throw new QuizGameError('QUESTION_NOT_ACTIVE', 'Сейчас нельзя ответить');
  }

  if (getSecondsRemaining(new Date(state.currentQuestion.deadlineAt)) <= 0) {
    await expireQuizQuestionIfNeeded(state, context);
    throw new QuizGameError('QUESTION_EXPIRED', 'Время на ответ истекло');
  }

  const alreadyAnswered = (state.currentQuestion.answers || []).some(
    (entry: { userId: { toString(): string } }) => entry.userId.toString() === userId
  );
  if (alreadyAnswered) {
    throw new QuizGameError('ALREADY_ANSWERED', 'Вы уже отправили ответ');
  }

  const configQuestion = getQuizQuestionById(state.currentQuestion.questionId);
  if (!configQuestion) {
    throw new QuizGameError('QUESTION_NOT_FOUND', 'Вопрос не найден');
  }

  const optionIds = state.currentQuestion.optionIds || [];
  if (!optionIds.includes(trimmed)) {
    throw new QuizGameError('EMPTY_ANSWER', 'Выберите один из вариантов');
  }

  const isCorrect = isQuizOptionCorrect(configQuestion, trimmed);
  const pointsEarned = isCorrect ? state.currentQuestion.points : 0;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const updated = await QuizGameState.findOneAndUpdate(
    {
      _id: state._id,
      'currentQuestion.status': 'answering',
      'currentQuestion.deadlineAt': { $gt: new Date() },
      'currentQuestion.answers.userId': { $ne: userObjectId },
    },
    {
      $push: {
        'currentQuestion.answers': {
          userId: userObjectId,
          text: trimmed,
          isCorrect,
          pointsEarned,
        },
      },
    },
    { new: true }
  );

  if (!updated?.currentQuestion) {
    const latest = await QuizGameState.findById(state._id);
    if (!latest?.currentQuestion || latest.currentQuestion.status !== 'answering') {
      throw new QuizGameError('QUESTION_NOT_ACTIVE', 'Сейчас нельзя ответить');
    }
    if (getSecondsRemaining(new Date(latest.currentQuestion.deadlineAt)) <= 0) {
      await expireQuizQuestionIfNeeded(latest, context);
      throw new QuizGameError('QUESTION_EXPIRED', 'Время на ответ истекло');
    }
    const alreadyStored = (latest.currentQuestion.answers || []).some(
      (entry: { userId: { toString(): string } }) => entry.userId.toString() === userId
    );
    if (alreadyStored) {
      throw new QuizGameError('ALREADY_ANSWERED', 'Вы уже отправили ответ');
    }
    throw new QuizGameError('QUESTION_NOT_ACTIVE', 'Сейчас нельзя ответить');
  }

  const participantIds = getUniqueParticipantIds(context);
  const allAnswered = participantIds.every((participantId) =>
    updated.currentQuestion!.answers.some(
      (entry: { userId: { toString(): string } }) => entry.userId.toString() === participantId
    )
  );

  if (allAnswered) {
    await resolveQuestionAndMaybeAwardDaily(updated, context);
  }

  return QuizGameState.findById(updated._id);
};

export const dismissQuizReveal = async (userId: string, context: QuizGameContext) => {
  const state = await QuizGameState.findOne({ relationshipId: context.relationship._id });
  if (!state?.currentQuestion || state.currentQuestion.status !== 'revealed') {
    return state;
  }

  state.currentQuestion = null;

  const participantIds = getUniqueParticipantIds(context);
  const currentPicker = state.pickerUserId?.toString() ?? userId;
  state.pickerUserId = new mongoose.Types.ObjectId(getOtherParticipantId(participantIds, currentPicker));

  finishBoardIfComplete(state);
  await state.save();
  return QuizGameState.findById(state._id);
};

export const syncQuizGameState = async (context: QuizGameContext) => {
  const state = await getOrCreateQuizGameState(context);
  await expireQuizQuestionIfNeeded(state, context);
  const refreshed = await QuizGameState.findById(state._id);
  if (!refreshed) {
    throw new QuizGameError('STATE_NOT_FOUND', 'Состояние игры не найдено');
  }
  return syncQuizLobby(refreshed, context);
};

export const getQuizGameParticipantIds = (context: QuizGameContext): string[] =>
  getUniqueParticipantIds(context);

export const getQuizLeaderboard = async (limit = 50) => {
  const entries = await QuizGameState.find({ totalScore: { $gt: 0 } })
    .sort({ totalScore: -1 })
    .limit(limit)
    .lean();

  const pairBest = new Map<string, { relationshipId: string; totalScore: number }>();

  await Promise.all(
    entries.map(async (entry) => {
      const relationship = await Relationship.findById(entry.relationshipId).select('userId partnerId');
      if (!relationship) {
        return;
      }

      const pairKey = [relationship.userId.toString(), relationship.partnerId.toString()].sort().join(':');
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

export const updateQuizGameBadges = async () => {
  const topPairs = await QuizGameState.find({ totalScore: { $gt: 0 } })
    .sort({ totalScore: -1 })
    .limit(10)
    .lean();

  const pairBest = new Map<string, { relationshipId: string; totalScore: number }>();

  await Promise.all(
    topPairs.map(async (entry) => {
      const relationship = await Relationship.findById(entry.relationshipId).select('userId partnerId');
      if (!relationship) {
        return;
      }

      const pairKey = [relationship.userId.toString(), relationship.partnerId.toString()].sort().join(':');
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
    { 'badges.gameId': 'quiz' },
    { $pull: { badges: { gameId: 'quiz' } } }
  );

  await Promise.all(
    ranked.map(async (entry, index) => {
      await Relationship.findByIdAndUpdate(entry.relationshipId, {
        $push: {
          badges: {
            gameId: 'quiz',
            rank: index + 1,
            earnedAt: new Date(),
          },
        },
      });
    })
  );
};

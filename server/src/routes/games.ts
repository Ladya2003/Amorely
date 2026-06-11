import { Router, Response } from 'express';
import { GAME_CATALOG, getGameById } from '../games/catalog';
import {
  getGameDailyResetStatus,
  getSingleGameDailyResetStatus,
} from '../games/gameDailyResetService';
import { TAP_SHOP_ITEMS } from '../games/tapGameConfig';
import {
  TapGameError,
  buyTapShopItem,
  formatTapGameState,
  getOrCreateTapGameState,
  getTapGameParticipantIds,
  getTapLeaderboard,
  normalizeTapBatchCount,
  processTapBatch,
  resolveTapGameContext,
  updateTapGameBadges,
} from '../games/tapGameService';
import {
  DrawGameError,
  advanceDrawRound,
  appendDrawStroke,
  clearDrawGuessAttempts,
  clearDrawStrokes,
  formatDrawGameState,
  redoDrawStroke,
  undoDrawStroke,
  getDrawGameParticipantIds,
  getDrawLeaderboard,
  getOrCreateDrawGameState,
  resolveDrawGameContext,
  setDrawPlayerReady,
  submitDrawFinishDrawing,
  submitDrawGuess,
  updateDrawGameBadges,
} from '../games/drawGameService';
import {
  GeoGameError,
  advanceGeoRound,
  expireGeoRound,
  formatGeoGameState,
  getGeoGameParticipantIds,
  getGeoLeaderboard,
  getOrCreateGeoGameState,
  resolveGeoGameContext,
  setGeoPlayerReady,
  submitGeoGuess,
  updateGeoGameBadges,
} from '../games/geoGameService';
import {
  QuizGameError,
  dismissQuizReveal,
  formatQuizGameState,
  getOrCreateQuizGameState,
  getQuizGameParticipantIds,
  getQuizLeaderboard,
  pickQuizQuestion,
  resolveQuizGameContext,
  setQuizPlayerReady,
  submitQuizAnswer,
  syncQuizGameState,
  updateQuizGameBadges,
} from '../games/quizGameService';
import { requireActiveRelationship } from '../utils/requireActiveRelationship';
import { getUserLocale } from '../utils/userLocale';

const router = Router();

const handleTapGameError = (error: unknown, res: Response): boolean => {
  if (error instanceof TapGameError) {
    const status =
      error.code === 'NO_PARTNER'
        ? 403
        : error.code === 'NOT_YOUR_TURN' ||
            error.code === 'ROUND_PART_COMPLETE' ||
            error.code === 'BOOST_ALREADY_ACTIVE' ||
            error.code === 'NOT_ENOUGH_POINTS' ||
            error.code === 'ITEM_LOCKED'
          ? 409
          : error.code === 'ITEM_NOT_FOUND'
            ? 404
            : 400;

    res.status(status).json({ error: error.message, code: error.code });
    return true;
  }

  return false;
};

const handleGeoGameError = (error: unknown, res: Response): boolean => {
  if (error instanceof GeoGameError) {
    const status =
      error.code === 'NO_PARTNER'
        ? 403
        : error.code === 'DAILY_LIMIT_REACHED'
          ? 403
          : error.code === 'ROUND_NOT_ACTIVE' ||
              error.code === 'ROUND_EXPIRED' ||
              error.code === 'ROUND_NOT_REVEALED' ||
              error.code === 'ROUND_NOT_EXPIRED'
            ? 409
            : 400;

    res.status(status).json({ error: error.message, code: error.code });
    return true;
  }

  return false;
};

const handleDrawGameError = (error: unknown, res: Response): boolean => {
  if (error instanceof DrawGameError) {
    const status =
      error.code === 'NO_PARTNER'
        ? 403
        : error.code === 'ROUND_ALREADY_ACTIVE' ||
            error.code === 'NOT_DRAWING' ||
            error.code === 'NOT_DRAWER' ||
            error.code === 'NOT_GUESSING' ||
            error.code === 'NOT_GUESSER' ||
            error.code === 'ROUND_NOT_REVEALED' ||
            error.code === 'GUESS_EXPIRED' ||
            error.code === 'TOO_MANY_GUESSES'
          ? 409
          : 400;

    res.status(status).json({ error: error.message, code: error.code });
    return true;
  }

  return false;
};

const handleQuizGameError = (error: unknown, res: Response): boolean => {
  if (error instanceof QuizGameError) {
    const status =
      error.code === 'NO_PARTNER'
        ? 403
        : error.code === 'ON_COOLDOWN' ||
            error.code === 'SESSION_ALREADY_ACTIVE' ||
            error.code === 'SESSION_NOT_ACTIVE' ||
            error.code === 'QUESTION_ALREADY_ACTIVE' ||
            error.code === 'QUESTION_NOT_ACTIVE' ||
            error.code === 'QUESTION_EXPIRED' ||
            error.code === 'CELL_NOT_AVAILABLE' ||
            error.code === 'ALREADY_ANSWERED'
          ? 409
          : 400;

    res.status(status).json({ error: error.message, code: error.code });
    return true;
  }

  return false;
};

router.get('/catalog', (_req, res: Response) => {
  res.json({ games: GAME_CATALOG });
});

router.get('/daily-reset', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const relationshipContext = await requireActiveRelationship(userId);

    if (!relationshipContext) {
      return res.json({ games: { geo: null, draw: null, quiz: null } });
    }

    const games = await getGameDailyResetStatus(relationshipContext.relationship._id);
    res.json({ games });
  } catch (error) {
    console.error('Ошибка games/daily-reset:', error);
    res.status(500).json({ error: 'Не удалось загрузить статус лимитов' });
  }
});

router.get('/tap/state', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveTapGameContext(userId);
    const state = await getOrCreateTapGameState(userId, context);

    res.json({
      state: formatTapGameState(state, userId, context),
      shopItems: TAP_SHOP_ITEMS,
    });
  } catch (error) {
    if (handleTapGameError(error, res)) {
      return;
    }
    console.error('Ошибка tap/state:', error);
    res.status(500).json({ error: 'Не удалось загрузить игру' });
  }
});

router.post('/tap/tap', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const tapCount = normalizeTapBatchCount(req.body?.count);
    const context = await resolveTapGameContext(userId);
    const { state, roundCompletionBonus } = await processTapBatch(userId, context, tapCount);

    if (roundCompletionBonus > 0) {
      await updateTapGameBadges();
    }

    res.json({
      state: formatTapGameState(state, userId, context),
      participantUserIds: getTapGameParticipantIds(context),
      ...(roundCompletionBonus > 0 ? { roundCompletionBonus } : {}),
    });
  } catch (error) {
    if (handleTapGameError(error, res)) {
      return;
    }
    console.error('Ошибка tap/tap:', error);
    res.status(500).json({ error: 'Не удалось обработать нажатие' });
  }
});

router.post('/tap/shop/buy', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'Не указан предмет' });
    }

    const context = await resolveTapGameContext(userId);
    const state = await buyTapShopItem(userId, context, itemId);

    res.json({
      state: formatTapGameState(state, userId, context),
      participantUserIds: getTapGameParticipantIds(context),
    });
  } catch (error) {
    if (handleTapGameError(error, res)) {
      return;
    }
    console.error('Ошибка tap/shop/buy:', error);
    res.status(500).json({ error: 'Не удалось купить предмет' });
  }
});

router.get('/geo/state', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveGeoGameContext(userId);
    const state = await getOrCreateGeoGameState(context);

    res.json({
      state: formatGeoGameState(state, userId, await getUserLocale(userId)),
    });
  } catch (error) {
    if (handleGeoGameError(error, res)) {
      return;
    }
    console.error('Ошибка geo/state:', error);
    res.status(500).json({ error: 'Не удалось загрузить игру' });
  }
});

router.post('/geo/ready', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveGeoGameContext(userId);
    const state = await setGeoPlayerReady(userId, context);

    res.json({
      state: formatGeoGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getGeoGameParticipantIds(context),
    });
  } catch (error) {
    if (handleGeoGameError(error, res)) {
      return;
    }
    console.error('Ошибка geo/ready:', error);
    res.status(500).json({ error: 'Не удалось подтвердить готовность' });
  }
});

router.post('/geo/guess', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { lat, lng } = req.body;
    const context = await resolveGeoGameContext(userId);
    const { state } = await submitGeoGuess(userId, context, Number(lat), Number(lng));

    await updateGeoGameBadges();

    res.json({
      state: formatGeoGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getGeoGameParticipantIds(context),
    });
  } catch (error) {
    if (handleGeoGameError(error, res)) {
      return;
    }
    console.error('Ошибка geo/guess:', error);
    res.status(500).json({ error: 'Не удалось отправить ответ' });
  }
});

router.post('/geo/next-round', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveGeoGameContext(userId);
    const { state } = await advanceGeoRound(userId, context);

    res.json({
      state: formatGeoGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getGeoGameParticipantIds(context),
    });
  } catch (error) {
    if (handleGeoGameError(error, res)) {
      return;
    }
    console.error('Ошибка geo/next-round:', error);
    res.status(500).json({ error: 'Не удалось начать раунд' });
  }
});

router.post('/geo/expire', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveGeoGameContext(userId);
    const state = await expireGeoRound(context);

    res.json({
      state: formatGeoGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getGeoGameParticipantIds(context),
    });
  } catch (error) {
    if (handleGeoGameError(error, res)) {
      return;
    }
    console.error('Ошибка geo/expire:', error);
    res.status(500).json({ error: 'Не удалось завершить раунд' });
  }
});

router.get('/draw/state', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveDrawGameContext(userId);
    const { publicState } = await getOrCreateDrawGameState(context, userId);

    res.json({
      state: publicState,
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/state:', error);
    res.status(500).json({ error: 'Не удалось загрузить игру' });
  }
});

router.post('/draw/ready', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveDrawGameContext(userId);
    const { publicState } = await setDrawPlayerReady(userId, context);

    res.json({
      state: publicState,
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/ready:', error);
    res.status(500).json({ error: 'Не удалось подтвердить готовность' });
  }
});

router.post('/draw/stroke', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { points, color, width, isEraser, isFill } = req.body;
    const context = await resolveDrawGameContext(userId);
    const state = await appendDrawStroke(userId, context, {
      points: points || [],
      color: color || '#111111',
      width: width || 4,
      isEraser: Boolean(isEraser),
      isFill: Boolean(isFill),
    });

    const locale = await getUserLocale(userId);
    res.json({
      state: formatDrawGameState(state, userId, locale),
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/stroke:', error);
    res.status(500).json({ error: 'Не удалось сохранить штрих' });
  }
});

router.post('/draw/finish-drawing', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveDrawGameContext(userId);
    const state = await submitDrawFinishDrawing(userId, context, true);

    res.json({
      state: formatDrawGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/finish-drawing:', error);
    res.status(500).json({ error: 'Не удалось завершить рисование' });
  }
});

router.post('/draw/guess', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { guess } = req.body;
    const context = await resolveDrawGameContext(userId);
    const state = await submitDrawGuess(userId, context, String(guess || ''));

    await updateDrawGameBadges();

    res.json({
      state: formatDrawGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/guess:', error);
    res.status(500).json({ error: 'Не удалось отправить ответ' });
  }
});

router.post('/draw/clear-strokes', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveDrawGameContext(userId);
    const state = await clearDrawStrokes(userId, context);

    res.json({
      state: formatDrawGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/clear-strokes:', error);
    res.status(500).json({ error: 'Не удалось очистить холст' });
  }
});

router.post('/draw/undo', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveDrawGameContext(userId);
    const state = await undoDrawStroke(userId, context);

    res.json({
      state: formatDrawGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/undo:', error);
    res.status(500).json({ error: 'Не удалось отменить действие' });
  }
});

router.post('/draw/redo', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveDrawGameContext(userId);
    const state = await redoDrawStroke(userId, context);

    res.json({
      state: formatDrawGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/redo:', error);
    res.status(500).json({ error: 'Не удалось вернуть действие' });
  }
});

router.post('/draw/clear-guess-attempts', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveDrawGameContext(userId);
    const state = await clearDrawGuessAttempts(context);

    res.json({
      state: formatDrawGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/clear-guess-attempts:', error);
    res.status(500).json({ error: 'Не удалось очистить попытки' });
  }
});

router.post('/draw/next-round', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveDrawGameContext(userId);
    const { state } = await advanceDrawRound(userId, context);

    res.json({
      state: formatDrawGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getDrawGameParticipantIds(context),
    });
  } catch (error) {
    if (handleDrawGameError(error, res)) {
      return;
    }
    console.error('Ошибка draw/next-round:', error);
    res.status(500).json({ error: 'Не удалось начать раунд' });
  }
});

router.get('/quiz/state', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveQuizGameContext(userId);
    const state = await getOrCreateQuizGameState(context);

    res.json({
      state: formatQuizGameState(state, userId, await getUserLocale(userId)),
    });
  } catch (error) {
    if (handleQuizGameError(error, res)) {
      return;
    }
    console.error('Ошибка quiz/state:', error);
    res.status(500).json({ error: 'Не удалось загрузить игру' });
  }
});

router.post('/quiz/ready', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveQuizGameContext(userId);
    const state = await setQuizPlayerReady(userId, context);

    res.json({
      state: formatQuizGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getQuizGameParticipantIds(context),
    });
  } catch (error) {
    if (handleQuizGameError(error, res)) {
      return;
    }
    console.error('Ошибка quiz/ready:', error);
    res.status(500).json({ error: 'Не удалось подтвердить готовность' });
  }
});

router.post('/quiz/pick', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { categoryId, points } = req.body;

    if (!categoryId || points == null) {
      return res.status(400).json({ error: 'Не указана ячейка' });
    }

    const context = await resolveQuizGameContext(userId);
    const state = await pickQuizQuestion(userId, context, String(categoryId), Number(points));

    await updateQuizGameBadges();

    res.json({
      state: formatQuizGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getQuizGameParticipantIds(context),
    });
  } catch (error) {
    if (handleQuizGameError(error, res)) {
      return;
    }
    console.error('Ошибка quiz/pick:', error);
    res.status(500).json({ error: 'Не удалось открыть вопрос' });
  }
});

router.post('/quiz/answer', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const { answer } = req.body;

    const context = await resolveQuizGameContext(userId);
    const state = await submitQuizAnswer(userId, context, String(answer ?? ''));

    await updateQuizGameBadges();

    res.json({
      state: formatQuizGameState(state!, userId, await getUserLocale(userId)),
      participantUserIds: getQuizGameParticipantIds(context),
    });
  } catch (error) {
    if (handleQuizGameError(error, res)) {
      return;
    }
    console.error('Ошибка quiz/answer:', error);
    res.status(500).json({ error: 'Не удалось отправить ответ' });
  }
});

router.post('/quiz/dismiss-reveal', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveQuizGameContext(userId);
    const state = await dismissQuizReveal(userId, context);

    res.json({
      state: formatQuizGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getQuizGameParticipantIds(context),
    });
  } catch (error) {
    if (handleQuizGameError(error, res)) {
      return;
    }
    console.error('Ошибка quiz/dismiss-reveal:', error);
    res.status(500).json({ error: 'Не удалось продолжить' });
  }
});

router.post('/quiz/sync', async (req: any, res: Response) => {
  try {
    const userId = req.userId as string;
    const context = await resolveQuizGameContext(userId);
    const state = await syncQuizGameState(context);

    res.json({
      state: formatQuizGameState(state, userId, await getUserLocale(userId)),
      participantUserIds: getQuizGameParticipantIds(context),
    });
  } catch (error) {
    if (handleQuizGameError(error, res)) {
      return;
    }
    console.error('Ошибка quiz/sync:', error);
    res.status(500).json({ error: 'Не удалось синхронизировать' });
  }
});

router.get('/:gameId/leaderboard', async (req: any, res: Response) => {
  const game = getGameById(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Игра не найдена' });
  }

  if (req.params.gameId === 'tap') {
    const entries = await getTapLeaderboard(50);
    return res.json({ gameId: 'tap', entries });
  }

  if (req.params.gameId === 'geo') {
    const entries = await getGeoLeaderboard(50);
    return res.json({ gameId: 'geo', entries });
  }

  if (req.params.gameId === 'draw') {
    const entries = await getDrawLeaderboard(50);
    return res.json({ gameId: 'draw', entries });
  }

  if (req.params.gameId === 'quiz') {
    const entries = await getQuizLeaderboard(50);
    return res.json({ gameId: 'quiz', entries });
  }

  res.json({ gameId: req.params.gameId, entries: [] });
});

router.get('/:gameId', async (req: any, res: Response) => {
  const game = getGameById(req.params.gameId);
  if (!game) {
    return res.status(404).json({ error: 'Игра не найдена' });
  }

  const userId = req.userId as string;
  const relationshipContext = await requireActiveRelationship(userId);
  const dailyReset = relationshipContext
    ? await getSingleGameDailyResetStatus(req.params.gameId, relationshipContext.relationship._id)
    : null;

  res.json({
    game,
    hasPartner: Boolean(relationshipContext),
    partner: relationshipContext
      ? {
          id: relationshipContext.partnerId,
          username: relationshipContext.partnerUser.username,
          firstName: relationshipContext.partnerUser.firstName,
          lastName: relationshipContext.partnerUser.lastName,
          avatar: relationshipContext.partnerUser.avatar,
        }
      : null,
    dailyReset,
  });
});

export default router;

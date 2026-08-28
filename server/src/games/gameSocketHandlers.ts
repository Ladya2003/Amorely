import { Server as SocketIOServer, Socket } from 'socket.io';
import DrawGameState from '../models/drawGameState';
import QuizGameState from '../models/quizGameState';
import User from '../models/user';
import {
  GeoGameError,
  advanceGeoRound,
  expireGeoRound,
  formatGeoGameState,
  getGeoGameParticipantIds,
  getOrCreateGeoGameState,
  resolveGeoGameContext,
  setGeoPlayerReady,
  submitGeoGuess,
  updateGeoGameBadges,
} from './geoGameService';
import {
  DrawGameError,
  advanceDrawRound,
  appendDrawStroke,
  clearDrawGuessAttempts,
  clearDrawStrokes,
  redoDrawStroke,
  undoDrawStroke,
  formatDrawGameState,
  getDrawGameParticipantIds,
  getOrCreateDrawGameState,
  resolveDrawGameContext,
  setDrawPlayerReady,
  submitDrawGuess,
  updateDrawGameBadges,
} from './drawGameService';
import {
  TapGameError,
  formatTapGameState,
  getOrCreateTapGameState,
  getTapGameParticipantIds,
  normalizeTapBatchCount,
  processTapBatch,
  resolveTapGameContext,
  updateTapGameBadges,
} from './tapGameService';
import {
  QuizGameError,
  dismissQuizReveal,
  formatQuizGameState,
  getOrCreateQuizGameState,
  getQuizGameParticipantIds,
  pickQuizQuestion,
  resolveQuizGameContext,
  setQuizPlayerReady,
  submitQuizAnswer,
  syncQuizGameState,
  updateQuizGameBadges,
} from './quizGameService';
import {
  CliffGameError,
  activateCliffLift,
  breakCliffGate,
  buyCliffShopItem,
  bindCliffPresenceNotify,
  enterCliffGame,
  enterCliffMine,
  enterCliffRopes,
  finishCliffBridge,
  jumpCliffRope,
  formatCliffGameState,
  getCliffGameParticipantIds,
  leaveCliffGame,
  resetCliffGateAndBridge,
  resetCliffRopes,
  resetCliffRun,
  resolveCliffGameContext,
  surrenderCliffBridge,
  tapCliffBoulder,
  throwCliffStone,
} from './cliffGameService';
import { bindGameCurrencyNotify } from './gameCurrencyAwards';
import { getUserLocale } from '../utils/userLocale';
import { getGameById, isGameVisibleToRole } from './catalog';

interface ConnectedUser {
  userId: string;
  socketId: string;
}

let gameCurrencyNotifyBound = false;
let cliffPresenceNotifyBound = false;

export const attachGameSocketHandlers = (
  socket: Socket,
  io: SocketIOServer,
  connectedUsers: ConnectedUser[]
) => {
  if (!gameCurrencyNotifyBound) {
    bindGameCurrencyNotify(io, connectedUsers);
    gameCurrencyNotifyBound = true;
  }

  socket.on('tap_game_subscribe', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveTapGameContext(senderSocketData.userId);
      const state = await getOrCreateTapGameState(senderSocketData.userId, context);

      socket.emit('tap_game_state', {
        state: formatTapGameState(state, senderSocketData.userId, context),
      });
    } catch (error) {
      if (error instanceof TapGameError) {
        socket.emit('tap_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('tap_game_subscribe error:', error);
    }
  });

  const emitTapGameStateToParticipants = async (
    state: any,
    context: Awaited<ReturnType<typeof resolveTapGameContext>>,
    roundCompletionBonus: number
  ) => {
    const participantUserIds = getTapGameParticipantIds(context);
    await Promise.all(
      participantUserIds.map(async (uid) => {
        const socketData = connectedUsers.find((user) => user.userId === uid);
        if (!socketData) {
          return;
        }
        const userContext = await resolveTapGameContext(uid);
        io.to(socketData.socketId).emit('tap_game_state', {
          state: formatTapGameState(state, uid, userContext),
          ...(roundCompletionBonus > 0 ? { roundCompletionBonus } : {}),
        });
      })
    );
  };

  socket.on('tap_game_tap', async (payload?: { count?: number }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('tap_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const tapCount = normalizeTapBatchCount(payload?.count);
      const context = await resolveTapGameContext(senderSocketData.userId);
      const { state, roundCompletionBonus } = await processTapBatch(
        senderSocketData.userId,
        context,
        tapCount
      );

      if (roundCompletionBonus > 0) {
        await updateTapGameBadges();
      }

      await emitTapGameStateToParticipants(state, context, roundCompletionBonus);
    } catch (error) {
      if (error instanceof TapGameError) {
        socket.emit('tap_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('tap_game_tap error:', error);
      socket.emit('tap_game_error', { message: 'Не удалось обработать нажатие' });
    }
  });

  const emitGeoStateToPartners = async (
    state: any,
    participantUserIds: string[]
  ) => {
    await Promise.all(
      participantUserIds.map(async (uid) => {
        const socketData = connectedUsers.find((user) => user.userId === uid);
        if (!socketData) {
          return;
        }
        const locale = await getUserLocale(uid);
        io.to(socketData.socketId).emit('geo_game_state', {
          state: formatGeoGameState(state, uid, locale),
        });
      })
    );
  };

  const emitGeoStateToUser = async (state: any, userId: string) => {
    const socketData = connectedUsers.find((user) => user.userId === userId);
    if (!socketData) {
      return;
    }
    const locale = await getUserLocale(userId);
    io.to(socketData.socketId).emit('geo_game_state', {
      state: formatGeoGameState(state, userId, locale),
    });
  };

  socket.on('geo_game_subscribe', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const state = await getOrCreateGeoGameState(context);

      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_subscribe error:', error);
    }
  });

  socket.on('geo_game_ready', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('geo_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const state = await setGeoPlayerReady(senderSocketData.userId, context);

      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_ready error:', error);
      socket.emit('geo_game_error', { message: 'Не удалось подтвердить готовность' });
    }
  });

  socket.on('geo_game_sync', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const state = await getOrCreateGeoGameState(context);

      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_sync error:', error);
    }
  });

  socket.on('geo_game_guess', async (payload: { lat?: number; lng?: number }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('geo_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const { state } = await submitGeoGuess(
        senderSocketData.userId,
        context,
        Number(payload?.lat),
        Number(payload?.lng)
      );

      await updateGeoGameBadges();
      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_guess error:', error);
      socket.emit('geo_game_error', { message: 'Не удалось отправить ответ' });
    }
  });

  socket.on('geo_game_next_round', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('geo_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const { state, allPartnersDismissed } = await advanceGeoRound(
        senderSocketData.userId,
        context
      );
      const participantUserIds = getGeoGameParticipantIds(context);

      if (allPartnersDismissed) {
        await emitGeoStateToPartners(state, participantUserIds);
      } else {
        await emitGeoStateToUser(state, senderSocketData.userId);
      }
    } catch (error) {
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_next_round error:', error);
      socket.emit('geo_game_error', { message: 'Не удалось начать раунд' });
    }
  });

  socket.on('geo_game_expire', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('geo_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveGeoGameContext(senderSocketData.userId);
      const state = await expireGeoRound(context);

      await emitGeoStateToPartners(state, getGeoGameParticipantIds(context));
    } catch (error) {
      if (error instanceof GeoGameError && error.code === 'ROUND_NOT_EXPIRED') {
        return;
      }
      if (error instanceof GeoGameError) {
        socket.emit('geo_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('geo_game_expire error:', error);
    }
  });

  const emitDrawStateToPartners = async (
    state: any,
    context: Awaited<ReturnType<typeof resolveDrawGameContext>>
  ) => {
    const participantUserIds = getDrawGameParticipantIds(context);
    const stateDoc = state?._id ? await DrawGameState.findById(state._id) : state;

    await Promise.all(
      participantUserIds.map(async (uid) => {
        const socketData = connectedUsers.find((user) => user.userId === uid);
        if (!socketData || !stateDoc) {
          return;
        }
        const locale = await getUserLocale(uid);
        io.to(socketData.socketId).emit('draw_game_state', {
          state: formatDrawGameState(stateDoc, uid, locale),
        });
      })
    );
  };

  const emitDrawStateToUser = async (
    state: any,
    userId: string,
    context: Awaited<ReturnType<typeof resolveDrawGameContext>>
  ) => {
    const stateDoc = state?._id ? await DrawGameState.findById(state._id) : state;
    const socketData = connectedUsers.find((user) => user.userId === userId);
    if (!socketData || !stateDoc) {
      return;
    }
    const locale = await getUserLocale(userId);
    io.to(socketData.socketId).emit('draw_game_state', {
      state: formatDrawGameState(stateDoc, userId, locale),
    });
  };

  socket.on('draw_game_subscribe', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const { state: gameState } = await getOrCreateDrawGameState(context, senderSocketData.userId);
      await emitDrawStateToPartners(gameState, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('draw_game_subscribe error:', error);
    }
  });

  socket.on('draw_game_ready', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('draw_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const { state } = await setDrawPlayerReady(senderSocketData.userId, context);

      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('draw_game_ready error:', error);
    }
  });

  socket.on('draw_game_sync', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const { state } = await getOrCreateDrawGameState(context, senderSocketData.userId);

      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on(
    'draw_game_stroke',
    async (payload: {
      points?: { x: number; y: number }[];
      color?: string;
      width?: number;
      isEraser?: boolean;
      isFill?: boolean;
    }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const points = payload?.points || [];
      const isFill = Boolean(payload?.isFill);
      if (isFill) {
        if (points.length < 1) {
          return;
        }
      } else if (points.length < 2) {
        return;
      }

      const stroke = {
        points,
        color: payload?.color || '#111111',
        width: payload?.width || 4,
        isEraser: Boolean(payload?.isEraser),
        isFill,
      };

      const state = await appendDrawStroke(senderSocketData.userId, context, stroke);
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_clear_strokes', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const state = await clearDrawStrokes(senderSocketData.userId, context);
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_undo', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const state = await undoDrawStroke(senderSocketData.userId, context);
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_redo', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const state = await redoDrawStroke(senderSocketData.userId, context);
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_guess', async (payload: { guess?: string }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const state = await submitDrawGuess(senderSocketData.userId, context, String(payload?.guess || ''));

      await updateDrawGameBadges();
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_leave', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const state = await clearDrawGuessAttempts(context);
      await emitDrawStateToPartners(state, context);
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('draw_game_next_round', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveDrawGameContext(senderSocketData.userId);
      const { state, allPartnersDismissed } = await advanceDrawRound(
        senderSocketData.userId,
        context
      );

      if (allPartnersDismissed) {
        await emitDrawStateToPartners(state, context);
      } else {
        await emitDrawStateToUser(state, senderSocketData.userId, context);
      }
    } catch (error) {
      if (error instanceof DrawGameError) {
        socket.emit('draw_game_error', { message: error.message, code: error.code });
      }
    }
  });

  const emitQuizStateToPartners = async (
    state: any,
    participantUserIds: string[]
  ) => {
    if (!state) {
      return;
    }

    const freshState = (await QuizGameState.findById(state._id)) ?? state;

    await Promise.all(
      participantUserIds.map(async (uid) => {
        const socketData = connectedUsers.find((user) => user.userId === uid);
        if (!socketData) {
          return;
        }
        const locale = await getUserLocale(uid);
        io.to(socketData.socketId).emit('quiz_game_state', {
          state: formatQuizGameState(freshState, uid, locale),
        });
      })
    );
  };

  socket.on('quiz_game_subscribe', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await getOrCreateQuizGameState(context);

      await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('quiz_game_subscribe error:', error);
    }
  });

  socket.on('quiz_game_ready', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        socket.emit('quiz_game_error', { message: 'Пользователь не авторизован' });
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await setQuizPlayerReady(senderSocketData.userId, context);

      await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('quiz_game_ready error:', error);
    }
  });

  socket.on('quiz_game_sync', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await syncQuizGameState(context);

      await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on(
    'quiz_game_pick',
    async (payload: { categoryId?: string; points?: number }) => {
      try {
        const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
        if (!senderSocketData) {
          return;
        }

        const context = await resolveQuizGameContext(senderSocketData.userId);
        const state = await pickQuizQuestion(
          senderSocketData.userId,
          context,
          String(payload?.categoryId ?? ''),
          Number(payload?.points)
        );

        await updateQuizGameBadges();
        await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
      } catch (error) {
        if (error instanceof QuizGameError) {
          socket.emit('quiz_game_error', { message: error.message, code: error.code });
        }
      }
    }
  );

  socket.on('quiz_game_answer', async (payload: { optionId?: string; answer?: string }) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await submitQuizAnswer(
        senderSocketData.userId,
        context,
        String(payload?.optionId ?? payload?.answer ?? '')
      );

      await emitQuizStateToPartners(state!, getQuizGameParticipantIds(context));
      await updateQuizGameBadges();
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
      }
    }
  });

  socket.on('quiz_game_dismiss_reveal', async () => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        return;
      }

      const context = await resolveQuizGameContext(senderSocketData.userId);
      const state = await dismissQuizReveal(senderSocketData.userId, context);

      await emitQuizStateToPartners(state, getQuizGameParticipantIds(context));
    } catch (error) {
      if (error instanceof QuizGameError) {
        socket.emit('quiz_game_error', { message: error.message, code: error.code });
      }
    }
  });

  const emitCliffStateToPartners = async (
    state: any,
    participantUserIds: string[],
    extra: Record<string, unknown> = {}
  ) => {
    await Promise.all(
      participantUserIds.map(async (uid) => {
        const socketData = connectedUsers.find((user) => user.userId === uid);
        if (!socketData) {
          return;
        }
        const userContext = await resolveCliffGameContext(uid);
        io.to(socketData.socketId).emit('cliff_game_state', {
          state: await formatCliffGameState(state, uid, userContext),
          ...extra,
        });
      })
    );
  };

  if (!cliffPresenceNotifyBound) {
    cliffPresenceNotifyBound = true;
    bindCliffPresenceNotify((state, context) => {
      void emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  }

  const withCliffAction = async (
    emitErrorOnMissingAuth: boolean,
    handler: (userId: string) => Promise<void>
  ) => {
    try {
      const senderSocketData = connectedUsers.find((user) => user.socketId === socket.id);
      if (!senderSocketData) {
        if (emitErrorOnMissingAuth) {
          socket.emit('cliff_game_error', { message: 'Пользователь не авторизован' });
        }
        return;
      }
      const actor = await User.findById(senderSocketData.userId).select('role');
      if (!isGameVisibleToRole(getGameById('cliff'), actor?.role)) {
        if (emitErrorOnMissingAuth) {
          socket.emit('cliff_game_error', { message: 'Игра не найдена' });
        }
        return;
      }
      await handler(senderSocketData.userId);
    } catch (error) {
      if (error instanceof CliffGameError) {
        socket.emit('cliff_game_error', { message: error.message, code: error.code });
        return;
      }
      console.error('cliff game socket error:', error);
      socket.emit('cliff_game_error', { message: 'Не удалось обработать действие' });
    }
  };

  socket.on('cliff_game_subscribe', async () => {
    await withCliffAction(false, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const { state, playIntro, introLine, enteringUserId } = await enterCliffGame(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context), {
        playIntro,
        introLine,
        enteringUserId,
      });
    });
  });

  socket.on('cliff_game_leave', async () => {
    await withCliffAction(false, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      await leaveCliffGame(userId, context);
    });
  });

  socket.on('cliff_game_buy', async (payload?: { itemId?: string }) => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await buyCliffShopItem(userId, context, String(payload?.itemId ?? ''));
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_enter_mine', async () => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await enterCliffMine(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_tap_boulder', async (payload?: { boulderId?: string; count?: number }) => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const { state, yielded, metal } = await tapCliffBoulder(
        userId,
        context,
        String(payload?.boulderId ?? ''),
        payload?.count
      );
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context), {
        yielded,
        metal,
        miningUserId: userId,
      });
    });
  });

  socket.on('cliff_game_break_gate', async () => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await breakCliffGate(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_throw', async (payload?: { hit?: boolean; angle?: number; power?: number }) => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await throwCliffStone(userId, context, Boolean(payload?.hit));
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context), {
        throwEvent: {
          userId,
          hit: Boolean(payload?.hit),
          angle: Number(payload?.angle) || 0,
          power: Number(payload?.power) || 0,
        },
      });
    });
  });

  socket.on('cliff_game_surrender', async () => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await surrenderCliffBridge(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_finish', async () => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await finishCliffBridge(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_activate_lift', async (payload?: { petIds?: string[] }) => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await activateCliffLift(userId, context, payload?.petIds ?? []);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_enter_ropes', async () => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await enterCliffRopes(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_rope_jump', async (payload?: { hit?: boolean }) => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await jumpCliffRope(userId, context, Boolean(payload?.hit));
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context), {
        ropeJump: { userId, hit: Boolean(payload?.hit) },
      });
    });
  });

  socket.on('cliff_game_reset', async () => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await resetCliffRun(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_reset_gate', async () => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await resetCliffGateAndBridge(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });

  socket.on('cliff_game_reset_ropes', async () => {
    await withCliffAction(true, async (userId) => {
      const context = await resolveCliffGameContext(userId);
      const state = await resetCliffRopes(userId, context);
      await emitCliffStateToPartners(state, getCliffGameParticipantIds(context));
    });
  });
};
